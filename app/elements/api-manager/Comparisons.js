(function () {
'use strict';

function compareBools(a, b) {
  // True is first.
  return b - a;
}

function compareStrings(a, b) {
  // Sort alphabetically, any language, case insensitive.
  return a.localeCompare(b);
}

function compareDateStrings(a, b) {
  return compareStrings(a, b);
}

function compareEvents(a, b) {
  // Sort order: starred, duration, alphabetical, id.
  return compareBools(a.starred, b.starred) ||
         compareDateStrings(a.startDate || a.endDate,
                            b.startDate || b.endDate) ||
         compareStrings(a.name, b.name) ||
         compareStrings(a.eventId, b.eventId) ||
         0;
}

window.Comparisons = {
  compareBools,
  compareStrings,
  compareDateStrings,
  compareEvents,
};

})();
