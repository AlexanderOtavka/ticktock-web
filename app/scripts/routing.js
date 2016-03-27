/* globals page */

window.addEventListener('WebComponentsReady', () => {
  'use strict';

  const app = Polymer.dom(document).querySelector('x-app');

  // We use Page.js for routing. This is a Micro
  // client-side router inspired by the Express router
  // More info: https://visionmedia.github.io/page.js/

  const DEFAULT_CALENDAR_ID = '*';

  // Routes
  page('/', scrollToTop, () => {
    eventList(DEFAULT_CALENDAR_ID);
  });

  page(escape`/calendars/${DEFAULT_CALENDAR_ID}`, '/');

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
  function escape(strings, ...paths) {
    let result = [strings[0]];
    paths.forEach((path, i) => {
      result.push(String(path).replace(/[\*:\(\)]/g, '\\$&') + strings[i + 1]);
    });

    return result.join('');
  }

  function eventList(selectedCalendar) {
    const PAGE_NAME = 'eventList';
    app.page = PAGE_NAME;
    app.route = `${PAGE_NAME}:${selectedCalendar}`;
    app.selectCalendar(app.getUrlDecoded(selectedCalendar));
  }
});
