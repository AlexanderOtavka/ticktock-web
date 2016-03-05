!function(e){"use strict";function n(e,n,a,r,d,o){return e?t.SIGNED_OUT:n||a?t.ERRORED:r||d?t.LOADING:Boolean((o||[]).length)?t.GOOD:t.EMPTY}function a(n){var a=Date.now();n.events.forEach(function(t,r){var d=0,o=0;if(t.startDate){var i=Date.parse(t.startDate);d=Math.floor((i-a)/1e3)}if(0>=d){d=0,delete t.startDate;var l=Date.parse(t.endDate);o=Math.floor((l-a)/1e3),0>o&&e.$.apiManager.deleteEventById(t.calendarId,t.eventId)}t.duration=d||o,t.durationFromStart=Boolean(d),n===e.selectedCalendar&&(e.notifyPath(["selectedCalendar","events",r,"duration"],t.duration),e.notifyPath(["selectedCalendar","events",r,"durationFromStart"],t.durationFromStart))})}window.addEventListener("WebComponentsReady",function(){setInterval(function(){a(e.selectedCalendar)},1e3),e.$.apiManager.signIn(!0)});var t={GOOD:0,EMPTY:1,LOADING:2,ERRORED:3,SIGNED_OUT:4};e.showHiddenCalendars=!1,e.showHiddenEvents=!1,e.getSignedOutClass=function(e){return e?"signed-out":""},e.getHiddenEventsToggleText=function(e){return e?"Hide Hidden Events":"Show Hidden Events"},e.getHiddenCalendarToggleText=function(e){return e?"Hide Hidden Calendars":"Show Hidden Calendars"},e.getHideHiddenCalendarToggle=function(e,n){return n||!e},e.getUrlEncoded=function(e){return encodeURIComponent(e)},e.getUrlDecoded=function(e){return decodeURIComponent(e)},e.getCalendarFilter=function(e){return e?null:function(e){return!e.hidden&&!e.calendarLoading&&!e.calendarErrored}},e.getCalendarErrored=function(e,a,r){return n(e,a,r)===t.ERRORED},e.getCalendarLoading=function(e,a,r,d,o){return n(e,a,r,d,o)===t.LOADING},e.getCalendarEmpty=function(e,a,r,d,o,i){return n(e,a,r,d,o,i)===t.EMPTY},e.showInstalledToast=function(){},e.showErrorToast=function(){e.$.error.show()},e.showNetworkErrorToast=function(){e.$.networkError.show()},e.closeDrawer=function(){var n=e.$.paperDrawerPanel;n.narrow&&n.closeDrawer()},e.scrollPageToTop=function(){e.$.mainArea.$.mainContainer.scrollTop=0},e.selectCalendar=function(n){var a;a=n?e.$.apiManager.getCalendarById(n):e.selectedCalendar,e.$.eventList.openedIndex=0,e.$.calendarSelector.select(a)},e.toggleShowHiddenEvents=function(){e.showHiddenEvents=!e.showHiddenEvents},e.toggleShowHiddenCalendars=function(){setTimeout(function(){e.showHiddenCalendars=!e.showHiddenCalendars},20)},e.showSigninPopup=function(){e.userInfo.signedOut&&e.$.apiManager.signIn(!1)},e.refreshThisCalendar=function(){e.$.apiManager.reloadEvents(e.selectedCalendar),e.$.eventList.openedIndex=0},e.onSelectedCalendarHiddenChanged=function(n){n.detail.value&&(e.showHiddenCalendars=!0)},e.onEventChanged=function(n){e.$.apiManager.patchEvent(n.detail)},e.onCalendarHiddenToggled=function(n){e.$.apiManager.patchCalendar({calendarId:n.target.calendarId,hidden:n.detail.value})}}(app);