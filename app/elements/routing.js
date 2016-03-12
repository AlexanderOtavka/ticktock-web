window.addEventListener('WebComponentsReady', function () {
  'use strict';

  // We use Page.js for routing. This is a Micro
  // client-side router inspired by the Express router
  // More info: https://visionmedia.github.io/page.js/

  const DEFAULT_CALENDAR_ID = '*';

  // Routes
  page('/', scrollToTop, () => {
    eventList(DEFAULT_CALENDAR_ID);
  });

  page(`/calendars/${escape(DEFAULT_CALENDAR_ID)}`, '/');

  page('/calendars/:calendarId', scrollToTop, data => {
    eventList(data.params.calendarId);
  });

  // Config
  page({
    // add #! before urls
    hashbang: true,
  });

  // Middleware
  function scrollToTop(ctx, next) {
    app.scrollPageToTop();
    next();
  }

  // Utility functions
  function escape(path) {
    return path.replace(/[\*:\(\)]/g, '\\$&');
  }

  function eventList(selectedCalendar) {
    const PAGE_NAME = 'eventList';
    app.page = PAGE_NAME;
    app.route = PAGE_NAME + ':' + selectedCalendar;
    app.selectCalendar(app.getUrlDecoded(selectedCalendar));
  }
});
