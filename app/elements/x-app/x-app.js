(function () {
'use strict';

//
// Constants
//

const CalendarStatus = {
  GOOD: 0,
  EMPTY: 1,
  LOADING: 2,
  ERRORED: 3,
  SIGNED_OUT: 4,
};

Polymer({
  is: 'x-app',

  ready() {
    this.showHiddenCalendars = false;
    this.showHiddenEvents = false;

    this.$.apiManager.signIn(true);
  },

  //
  // Getters
  //

  getUrlEncoded(string) {
    return encodeURIComponent(string);
  },

  getUrlDecoded(string) {
    return decodeURIComponent(string);
  },

  _getSignedOutClass(signedOut) {
    return signedOut ? 'signed-out' : '';
  },

  _getHiddenEventsToggleText(showHiddenEvents) {
    return showHiddenEvents ? 'Hide Hidden Events' : 'Show Hidden Events';
  },

  _getHiddenCalendarToggleText(showHiddenCalendars) {
    return showHiddenCalendars ? 'Hide Hidden Calendars' :
                                 'Show Hidden Calendars';
  },

  _getHideHiddenCalendarToggle(hasHiddenCalendars, selectedHidden) {
    return selectedHidden || !hasHiddenCalendars;
  },

  _getCalendarFilter(showHiddenCalendars) {
    if (!showHiddenCalendars) {
      return calendar => !calendar.hidden && !calendar.calendarLoading &&
                         !calendar.calendarErrored;
    } else {
      return null;
    }
  },

  _getCalendarErrored(signedOut, calendarErrored, eventsErrored) {
    return getCalendarStatus(signedOut, calendarErrored, eventsErrored) ===
           CalendarStatus.ERRORED;
  },

  _getCalendarLoading(signedOut, calendarErrored, eventsErrored, eventsLoading,
                      nextPageToken) {
    return getCalendarStatus(signedOut, calendarErrored, eventsErrored,
                             eventsLoading, nextPageToken) ===
           CalendarStatus.LOADING;
  },

  _getCalendarEmpty(signedOut, calendarErrored, eventsErrored, eventsLoading,
                    nextPageToken, events) {
    return getCalendarStatus(signedOut, calendarErrored, eventsErrored,
                             eventsLoading, nextPageToken, events) ===
           CalendarStatus.EMPTY;
  },

  //
  // Actions
  //

  selectCalendar(calendarId) {
    let calendar;
    if (calendarId) {
      calendar = this.$.apiManager.getCalendarById(calendarId);
    } else {
      calendar = this.selectedCalendar;
    }

    this.$.eventList.openedIndex = 0;

    this.$.calendarSelector.select(calendar);
  },

  /**
   * Scroll page to top and expand header.
   */
  scrollPageToTop() {
    this.$.mainArea.$.mainContainer.scrollTop = 0;
  },

  _showErrorToast() {
    this._showToast('An error occurred.');
  },

  _showNetworkErrorToast() {
    this._showToast('There was a problem with the network.');
  },

  _showToast(message) {
    const toast = this.$$('paper-toast');
    toast.text = message;
    toast.show();
  },

  /**
   * Close drawer after menu item is selected if drawerPanel is narrow.
   */
  _closeDrawer() {
    const drawerPanel = this.$.paperDrawerPanel;
    if (drawerPanel.narrow) {
      drawerPanel.closeDrawer();
    }
  },

  _toggleShowHiddenEvents() {
    this.showHiddenEvents = !this.showHiddenEvents;
  },

  _toggleShowHiddenCalendars() {
    requestAnimationFrame(() =>
      this.showHiddenCalendars = !this.showHiddenCalendars
    );
  },

  _showSigninPopup() {
    if (this.userInfo.signedOut) {
      this.$.apiManager.signIn(false);
    }
  },

  _refreshThisCalendar() {
    this.$.apiManager.reloadEvents(this.selectedCalendar);
    this.$.eventList.openedIndex = 0;
  },

  //
  // Event handlers
  //

  _onSelectedCalendarHiddenChanged(event) {
    if (event.detail.value) {
      this.showHiddenCalendars = true;
    }
  },

  _onEventModified(event) {
    this.$.apiManager.patchEvent(event.detail);
  },

  _onEventFinish(event) {
    this.$.apiManager.deleteEventById(event.detail.calendarId,
                                      event.detail.eventId);
  },

  _onCalendarHiddenToggled(event) {
    this.$.apiManager.patchCalendar({
      calendarId: event.target.calendarId,
      hidden: event.detail.value,
    });
  },
});

//
// Utility Functions
//

function getCalendarStatus(signedOut, calendarErrored, eventsErrored,
                           eventsLoading, nextPageToken, events) {
  if (signedOut) {
    return CalendarStatus.SIGNED_OUT;
  }

  if (calendarErrored || eventsErrored) {
    return CalendarStatus.ERRORED;
  }

  if (eventsLoading || nextPageToken) {
    return CalendarStatus.LOADING;
  }

  if (!Boolean((events || []).length)) {
    return CalendarStatus.EMPTY;
  }

  return CalendarStatus.GOOD;
}

})();
