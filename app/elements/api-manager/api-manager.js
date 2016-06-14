/* globals CompositeEventGroup, EventGroup, Comparisons */

(function () {
'use strict';

const { compareDateStrings, compareEvents } = Comparisons;

//
// API configuration
//

GAPIManager.setClientId(
  '208366307202-00824keo9p663g1uhkd8misc52e1c5pa.apps.googleusercontent.com'
);
GAPIManager.setScopes([
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar.readonly',
]);

const LOCAL_API_ROOT = `//${window.location.host}/_ah/api`;
const ticktockAPILoaded = GAPIManager.loadAPI('ticktock', 'v1', LOCAL_API_ROOT);
const oauth2APILoaded = GAPIManager.loadAPI('oauth2', 'v2');

//
// Constants
//

const SIGNED_OUT_USER_INFO = {
  name: 'Sign In with Google',
  picture: '/images/google-logo.svg',
  loading: false,
  signedOut: true,
};
const LOADING_USER_INFO = {
  name: 'Loading...',
  picture: '',
  loading: true,
  signedOut: false,
};

const CALENDAR_ERROR_FIELDS = {
  eventsErrored: true,
  eventsLoading: false,
  calendarErrored: true,
  calendarLoading: false,
};

//
// Static Variables
//

// TODO: abstract away mutation with classes
/*** MY THOUGHTS ON THE PROBLEM ***

CHALLENGES (*) and solutions (-):
* Loading events with the proper filters from the api
  - EventLine class, which knows its filters
  * Loading the next page, after filters change
    - EventLines can be made for a set of filters
  * Using the events I already have that fit those filters
    - When an event line is created, it gets all the events it can from the two
      permanent event lines, representing unhidden events and all events
    * Minimizing the number of times I need to recalculate those events
      - Keep the all and the unhidden event lines around, unhidden is the most
        likely to be viewed, and all has the most data available
* Modifying multiple arrays with similar data when one data point changes
  - EventGroup class keeps track of three event lines per calendar: unhidden,
    all, and virtual, which represents any extra filters applied, and will be
    discarded when filters change.  EventGroup knows which line is in use.
  * Signaling modifications to the databinding system
    - Add methods on api-manager, which update the splices, but also call
      EventGroup updater methods.  These methods call the updater methods for
      the EventGroups of both the event's calendar and the ALL_CALENDAR
      EventGroup.  EventGroup updater methods return the splices to be passed to
      updateSplices.

CIRCULAR REFERENCES OK

Array mutators:
* deleteEventById - Removes an item
* _loadEvents - Concatenates on events
* _singleSortEvent - Moves an item

***********************************/

let _eventGroups = new WeakMap([
  [ALL_CALENDAR, ALL_CALENDAR.eventGroup],
]);

let _instantiated = false;

//
// Element declaration
//

Polymer({
  is: 'api-manager',

  properties: {
    userInfo: {
      type: Object,
      notify: true,
      value: LOADING_USER_INFO,
    },
    calendars: {
      type: Object,
      notify: true,
      value: () => [ALL_CALENDAR],
    },
    hasHiddenCalendars: {
      type: Boolean,
      notify: true,
      readOnly: true,
      value: false,
    },
    showHiddenEvents: {
      type: Boolean,
    },
    showHiddenCalendars: {
      type: Boolean,
      observer: '_filterCalendars',
    },
    search: {
      type: String,
      observer: '_searchChanged',
      value: null,
    },
    eventFilters: {
      type: Object,
      computed: '_getEventFilters(showHiddenEvents, search)',
    },
  },

  observers: [
    '_calendarsChanged(calendars.*)',
  ],

  //
  // Lifecycle callbacks
  //

  created() {
    if (!_instantiated) {
      _instantiated = true;
    } else {
      throw new TypeError('api-manager element is meant to be a singleton.');
    }

    this.allCalendar = {
      name: 'All Calendars',
      calendarId: '*',
      color: '#e91e63',
      icon: 'ticktock:calendar-multiple',
      noMenu: true,
      eventsErrored: false,
      eventsLoading: true,
      calendarErrored: false,
      calendarLoading: false,
      hidden: false,
      events: [],
      nextPageToken: null,
      eventGroup: new CompositeEventGroup(this, this.allCalendar,
                                          this.eventFilters),
    };

    this._calendars = [this.allCalendar];
    this._calendarsLoading = true;
  },

  //
  // Public api
  //

  /**
   * Authenticate the user and do an initial load.
   *
   * @param {Boolean} mode - True suppresses the popup and uses the cookie.
   * @return {Promise} - Promise that resolves on success.
   */
  signIn(mode) {
    return this._authorize(mode)
      .then(() => this._loadAllData());
  },

  /**
   * Remove all signed in UI.
   *
   * @return {Promise} - Promise that resolves on success.
   */
  signOut() {
    this.userInfo = SIGNED_OUT_USER_INFO;
    this.calendars = [];

    // TODO: actually sign the user out
    return Promise.resolve();
  },

  /**
   * Clear cache and reload events for given calendar.
   *
   * @param {Object} calendar - Calendar data object to be reloaded.
   * @return {Promise} - Promise that resolves to the new event list.
   */
  reloadEvents(calendar) {
    if (calendar.calendarErrored ||
        calendar.eventsLoading ||
        this.userInfo.signedOut) {
      return;
    }

    let calendars;
    if (calendar === ALL_CALENDAR) {
      calendars = this.calendars.slice();
      let i = calendars.findIndex(calendar => calendar === ALL_CALENDAR);
      calendars.splice(i, 1);
    } else {
      calendars = [calendar];
    }

    return this._loadEvents(calendars);
  },

  /**
   * Load the next page for a given calendar.
   *
   * @param {Object} calendar - Calendar data object whose next page will be
   *   loaded.
   * @return {Promise} - Promise that resolves to the new event list.
   */
  loadNextEvents(calendar) {
    if (calendar.calendarErrored ||
        calendar.eventsLoading ||
        this.userInfo.signedOut) {
      return;
    }

    // TODO: implement loading of next page
    console.log(
      `Loading next page for calendar with id = ${calendar.calendarId}`
    );

    this._setCalendarProps(calendar, { eventsLoading: true });

    // This promise will be pending forever
    return new Promise(() => {});
  },

  getCalendarById(calendarId) {
    let foundCalendar = _calendars.find(calendar =>
      calendar.calendarId === calendarId
    );

    return foundCalendar || this._makeProxyCalendar(calendarId);
  },

  deleteEventById(calendarId, eventId) {
    let calendar = this.calendars.find(calendar =>
      calendar.calendarId === calendarId
    );

    _eventGroups.get(calendar).removeById(calendarId, eventId);

    // {
    //   let i = getEventIndexById(calendar, eventId);
    //   if (i !== -1) {
    //     let calendarKey = this._getCalendarKey(calendar);
    //     this.splice(['calendars', calendarKey, 'events'], i, 1);
    //   }
    // }
    //
    // {
    //   let i = getEventIndexById(ALL_CALENDAR, eventId, calendarId);
    //   if (i !== -1) {
    //     let calendarKey = this._getCalendarKey(ALL_CALENDAR);
    //     this.splice(['calendars', calendarKey, 'events'], i, 1);
    //   }
    // }
  },

  //
  // Getters
  //

  _getEventFilters(showHidden, search) {
    return {
      hidden: showHidden ? null : false,
      search: search || null,
    };
  },

  //
  // Observers
  //

  _searchChanged(newSearch) {
    // TODO: implement search filtering
    console.log(`search changed to "${newSearch}"`);
    if (newSearch) {
      console.log('running clientside search (not really)');
    } else if (newSearch === '') {
      console.log('clearing event lists (not really)');
    } else if (newSearch === null) {
      console.log('removing search filter (not really)');
    }
  },

  _calendarsChanged(changeRecord) {
    let handlers = [
      this._handleSpliceChange,
      this._handleCalendarStateChange,
      this._handleEventStateChange,
    ];

    handlers.find(handler => handler.call(this, changeRecord));
  },

  _handleSpliceChange({ path }) {
    if (path.search(/^calendars$/) !== -1) {
      this._updateAllCalendarState();
      return true;
    } else {
      return false;
    }
  },

  _handleCalendarStateChange({ path }) {
    let collection = Polymer.Collection.get(this.calendars);
    let result = path.match(/^calendars\.(#\d)+\.hidden$/);

    if (result && result[1] !== collection.getKey(ALL_CALENDAR)) {
      let calendar = collection.getItem(result[1]);

      this._patchCalendar(calendar);
      if (calendar.hidden) {
        this._filterCalendars();
      }

      let hasHiddenCalendars = _calendars.find(calendar => calendar.hidden);
      this._setHasHiddenCalendars(Boolean(hasHiddenCalendars));

      return true;
    } else {
      return false;
    }
  },

  _handleEventStateChange({ path, value: propValue }) {
    let result = path.match(
      /^calendars\.#(\d+)\.events\.#(\d+)\.(hidden|starred)$/
    );

    if (result) {
      let [, calendarIndex, eventIndex, propName] = result;
      let calendar = this.calendars[calendarIndex];
      let calendarEvent = calendar.events[eventIndex];

      if (propName === 'starred' && propValue && calendarEvent.hidden) {
        this.set(`calendars.${calendarIndex}.events.${eventIndex}.hidden`,
                 false);
      } else if (propName === 'hidden' && propValue && calendarEvent.starred) {
        this.set(`calendars.${calendarIndex}.events.${eventIndex}.starred`,
                 false);
      } else {
        this._patchEvent(calendarEvent);
      }

      return true;
    } else {
      return false;
    }
  },

  //
  // Utility methods
  //

  /**
   * Like this.set, but to be used if calendarKey is unknown.
   *
   * @param {Object} calendar - Reference to the calendar.
   * @param {Object} props
   */
  _setCalendarProps(calendar, props, key = this._getCalendarKey(calendar)) {
    Object.assign(calendar, props);

    if (key !== null) {
      Object.keys(props).forEach(name => {
        this.notifyPath(`calendars.${key}.${name}`, props[name]);
      });
    }
  },

  _addCalendarProps(calendar, props, key = this._getCalendarKey(calendar)) {
    let propNames = Object.keys(props).filter(name => {
      if (!calendar.hasOwnProperty(name)) {
        calendar[name] = props[name];
        return true;
      } else {
        return false;
      }
    });

    if (key) {
      propNames.forEach(name => {
        this.notifyPath(`calendars.${key}.${name}`, props[name]);
      });
    }
  },

  _getCalendarKey(calendar) {
    return Polymer.Collection.get(this.calendars).getKey(calendar) || null;
  },

  _filterCalendars() {
    if (this.showHiddenCalendars) {
      this.calendars = _calendars;
    } else {
      this.calendars = _calendars.filter(calendar => !calendar.hidden);
    }
  },

  _authorize(mode) {
    return GAPIManager.authorize(mode)
      .then(() => {
        this.userInfo = LOADING_USER_INFO;
      })
      .catch(err => {
        if (err instanceof GAPIManager.AuthError && err.accessDenied) {
          this.signOut();
        }

        throw err;
      });
  },

  _loadAllData() {
    return Promise.all([
      this._loadProfile()
        .catch(err => this._handleHTTPError(err)),
      this._loadCalendars()
        .then(calendars => this._loadEvents(calendars))
        .catch(err => this._handleHTTPError(err)),
    ]);
  },

  _loadProfile() {
    let apiRequest = oauth2APILoaded
      .then(oauth2 => oauth2.userinfo.v2.me.get({
        fields: 'name,picture',
      }));

    return this._sendReAuthedRequest(apiRequest)
      .then(resp => {
        resp.loading = false;
        resp.signedOut = false;
        this.userInfo = resp;
      });
  },

  _loadCalendars() {
    _calendarsLoading = true;
    let apiRequest = ticktockAPILoaded
      .then(ticktock => ticktock.calendars.list({
        hidden: null,
      }));

    return this._sendReAuthedRequest(apiRequest)
      .then(({ items: calendars = [] }) => {
        let hasHiddenCalendars = false;
        calendars.forEach((calendar, i) => {
          let duplicateKey;
          let duplicateIndex = _calendars.findIndex(oldCalendar =>
            oldCalendar.calendarId === calendar.calendarId
          );

          if (duplicateIndex !== -1) {
            let duplicate = _calendars.splice(duplicateIndex, 1)[0];
            duplicateKey = this._getCalendarKey(duplicate);
            Object.assign(duplicate, calendar);
            calendar = duplicate;
            calendars.splice(i, 1, calendar);
          }

          this._setCalendarProps(calendar, {
            calendarErrored: false,
            calendarLoading: false,
            icon: '',
            noMenu: false,
          }, duplicateKey);

          this._addCalendarProps(calendar, {
            events: [],
            eventsErrored: false,
            eventsLoading: false,
            nextPageToken: null,
          }, duplicateKey);

          if (calendar.hidden) {
            hasHiddenCalendars = true;
          }

          if (!_eventGroups.has(calendar)) {
            let eventGroup = new EventGroup(this, calendar, this.eventFilters);
            _eventGroups.set(calendar, eventGroup);
            ALL_CALENDAR_EVENT_GROUP.addChild(eventGroup);
          }
        });

        this._setHasHiddenCalendars(hasHiddenCalendars);

        _calendarsLoading = false;
        _calendars.forEach(calendar => {
          if (calendar.calendarLoading) {
            this._setCalendarProps(calendar, CALENDAR_ERROR_FIELDS);
          }
        });

        _calendars.push(...calendars);
        this._filterCalendars();

        return calendars;
      });
  },

  _loadEvents(calendars) {
    let promise = Promise.all(calendars.map(calendar => {
      let calendarKey = this._getCalendarKey(calendar);
      this._setCalendarProps(calendar, {
        // events: [],
        eventsErrored: false,
        eventsLoading: true,
      }, calendarKey);

      // let apiRequest = ticktockAPILoaded
      //   .then(ticktock => ticktock.events.list({
      //     calendarId: encodeURIComponent(calendar.calendarId),
      //     hidden: null,
      //     maxResults: 10,
      //     timeZone: timeZone,
      //   }));
      //
      // return this._sendReAuthedRequest(apiRequest)
      //   .then(({ items: events, nextPageToken = null }) => {
      //     calendarKey = this._getCalendarKey(calendar);
      //
      //     this._setCalendarProps(calendar, { nextPageToken }, calendarKey);
      //
      //     if (events) {
      //       events.forEach(calendarEvent => {
      //         calendarEvent.color = calendar.color;
      //         calendarEvent.calendarHidden = calendar.hidden;
      //       });
      //
      //       events = events.sort(compareEvents);
      //       this._setCalendarProps(calendar, { events }, calendarKey);
      //     }
      //   })
      let apiRequest = ticktockAPILoaded
        .then(api => _eventGroups.get(calendar).loadNext(api));

      return this._sendReAuthedRequest(apiRequest)
        .catch(err => {
          this._setCalendarProps(calendar, { eventsErrored: true },
                                 calendarKey);
          throw err;
        })
        .catch(err => this._handleHTTPError(err))
        .then(() =>
          this._setCalendarProps(calendar, { eventsLoading: false },
                                 calendarKey)
        );
    }))
      .then(() => this._updateAllCalendarState());

    this._updateAllCalendarState();

    return promise;
  },

  /**
   * Update event's data on the server.
   *
   * @param {Object} calendarEvent
   * @return {Promise} - Promise that resolves to the new event state.
   */
  _patchEvent(calendarEvent) {
    let { calendarId, eventId, starred, hidden } = calendarEvent;

    let calendar = this.getCalendarById(calendarId);
    _eventGroups.get(calendar).sortEvent(calendarEvent);

    let apiRequest = ticktockAPILoaded
      .then(ticktock => ticktock.events.patch({
        calendarId: encodeURIComponent(calendarId),
        eventId,
        starred,
        hidden,
      }));

    return this._sendReAuthedRequest(apiRequest)
      .catch(err => this._handleHTTPError(err));
  },

  /**
   * Update calendar's data on the server.
   *
   * @param {Object} calendar
   * @return {Promise} - Promise that resolves to the new calendar state.
   */
  _patchCalendar(calendar) {
    let { calendarId, hidden } = calendar;
    let calendarKey = this._getCalendarKey(calendar);
    let allCalendarKey = this._getCalendarKey(ALL_CALENDAR);

    ALL_CALENDAR.events.forEach((calendarEvent, i) => {
      if (calendarEvent.calendarId === calendar.calendarId) {
        this.set(`calendars.${allCalendarKey}.events.${i}.calendarHidden`,
                 calendar.hidden);
      }
    });

    if (calendarKey) {
      calendar.events.forEach((calendarEvent, i) => {
        this.notifyPath(`calendars.${calendarKey}.events.${i}.calendarHidden`,
                        calendar.hidden);
      });
    }

    let apiRequest = ticktockAPILoaded
      .then(ticktock => ticktock.calendars.patch({
        calendarId: encodeURIComponent(calendarId),
        hidden,
      }));

    return this._sendReAuthedRequest(apiRequest)
      .catch(err => this._handleHTTPError(err));
  },

  _updateAllCalendarState() {
    let calendars = this.calendars.slice();
    let allCalendarIndex = calendars.indexOf(ALL_CALENDAR);
    calendars.splice(allCalendarIndex, 1);

    let eventsLoading = (this.calendars.length - 1) ? false : _calendarsLoading;
    let eventsErrored = (this.calendars.length - 1) ? true : false;
    calendars.forEach(calendar => {
      if (calendar !== ALL_CALENDAR) {
        if (calendar.eventsLoading) {
          eventsLoading = true;
        }

        if (!calendar.eventsErrored) {
          eventsErrored = false;
        }
      }
    });

    if (eventsLoading) {
      eventsErrored = false;
    }

    let smallestDate = '';
    calendars.forEach(calendar => {
      if (calendar.events.length && calendar.nextPageToken) {
        let lastEventDate = calendar.events[calendar.events.length - 1].endDate;
        if (compareDateStrings(lastEventDate, smallestDate) < 0 ||
            !smallestDate) {
          smallestDate = lastEventDate;
        }
      }
    });

    let events = [];
    calendars.forEach(calendar => {
      // TODO: record this index for use in grabbing the next page
      calendar.events.findIndex(calendarEvent => {
        if (compareDateStrings(calendarEvent.endDate, smallestDate) > 0) {
          return true;
        } else {
          events.push(calendarEvent);
          return false;
        }
      });
    });

    events = events.sort(compareEvents);

    this._setCalendarProps(ALL_CALENDAR, {
      eventsLoading,
      eventsErrored,
      events,
    }, allCalendarIndex);
  },

  _handleHTTPError(err) {
    if (err instanceof GAPIManager.HTTPError) {
      console.warn(err);
      if (err.code === -1) {
        this.fire('network-error');
      } else if (err.code === 401) {
        this.signOut();
      } else {
        this.fire('error');
      }
    } else {
      throw err;
    }
  },

  _sendReAuthedRequest(request) {
    return request
      .catch(err => {
        if (err.code === 401) {
          console.warn(err);
          return this.signIn(true)
            .then(() => request);
        } else {
          throw err;
        }
      });
  },

  /**
   * Move an event to its proper place in its calendar and the ALL_CALENDAR.
   *
   * Uses the insertion sort algorithm, and notifies splices.
   *
   * @param {Object} calendarEvent
   */
  _singleSortEvent(calendarEvent) {
    let calendar = this.getCalendarById(calendarEvent.calendarId);
    this._singleSortByCalendar(calendar, calendarEvent.eventId);
    if (calendar !== ALL_CALENDAR) {
      this._singleSortByCalendar(ALL_CALENDAR, calendarEvent.eventId);
    }
  },

  _singleSortByCalendar(calendar, eventId) {
    /************************
    Algorithm Summary Drawing
    *************************
                  *-3
    [1, 6, 9, 15, 19, 22]
        ^
    (1, 3)? yes
       (6, 3)? no

    [1, 6, 9, 15, 3, 19, 22]
            - to -
    [1, 3, 6, 9, 15, 19, 22]
    -----------------------------
        *-16
    [1, 9, 15, 17, 19, 22]
               ^
    (1, 16)? yes
       (9, 16)? yes
          (15, 16)? yes
              (17, 16)? no

    [1, 16, 9, 15, 17, 19, 22]
             - to -
    [1, 9, 15, 16, 17, 19, 22]
    ************************/
    let misplacedIndex = calendar.events.findIndex(calendarEvent =>
      calendarEvent.eventId === eventId
    );

    if (misplacedIndex === -1) {
      return;
    }

    let misplacedEvent = calendar.events.splice(misplacedIndex, 1)[0];

    let targetIndex = calendar.events.findIndex(calendarEvent =>
      compareEvents(calendarEvent, misplacedEvent) > 0
    );

    calendar.events.splice(targetIndex, 0, misplacedEvent);

    let calendarKey = this._getCalendarKey(calendar);
    if (calendarKey) {
      this.notifySplices(['calendars', calendarKey, 'events'], [
        {
          index: misplacedIndex,
          removed: [misplacedEvent],
          addedCount: 0,
          object: calendar.events,
          type: 'splice',
        },
        {
          index: targetIndex,
          removed: [],
          addedCount: 1,
          object: calendar.events,
          type: 'splice',
        },
      ]);
    }
  },

  _makeProxyCalendar(calendarId) {
    let proxy = {
      name: 'TickTock',
      calendarId: calendarId,
      color: '#e91e63',
      icon: '',
      noMenu: false,
      eventsErrored: false,
      eventsLoading: true,
      calendarErrored: false,
      calendarLoading: true,
      hidden: false,
      events: [],
      nextPageToken: null,
    };

    if (!_calendarsLoading) {
      this._setCalendarProps(proxy, CALENDAR_ERROR_FIELDS, null);
    }

    _calendars.push(proxy);
    this.push('calendars', proxy);
    return proxy;
  },
});

//
// Utility functions
//

// function getEventIndexById(calendar, eventId,
//                            calendarId = calendar.calendarId) {
//   return calendar.events.findIndex(calendarEvent =>
//     calendarEvent.eventId === eventId &&
//     calendarEvent.calendarId === calendarId
//   );
// }

})();
