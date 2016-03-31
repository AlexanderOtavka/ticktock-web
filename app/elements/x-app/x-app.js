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

//
// Element declaration
//

Polymer({
  is: 'x-app',

  observers: [
    '_selectedCalendarHiddenChanged(selectedCalendar.hidden)',
  ],

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
      return calendar => !calendar.calendarLoading && !calendar.calendarErrored;
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

  showToast(message) {
    this.$.toast.text = message;
    this.$.toast.show();
  },

  showErrorToast() {
    this.showToast('An error occurred.');
  },

  showNetworkErrorToast() {
    this.showToast('There was a problem with the network.');
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
    this.scrollPageToTop();
    this.showHiddenEvents = !this.showHiddenEvents;
  },

  _toggleShowHiddenCalendars() {
    this.scrollPageToTop();
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
  
  _openSearchInput(){
      console.log("Open");
      this.searchOpen = true;
  },
  
  _closeSearchInput(){
      console.log("Close");
      this.searchOpen = false;
  },

  //
  // Observers
  //

  _selectedCalendarHiddenChanged(hidden) {
    if (hidden) {
      this.showHiddenCalendars = true;
    }
  },

  //
  // Event handlers
  //

  _onEventFinish(event) {
    this.$.apiManager.deleteEventById(event.detail.calendarId,
                                      event.detail.eventId);
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
