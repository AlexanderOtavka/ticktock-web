(function () {
'use strict';

var COLLAPSE_CONTENT_HEIGHT = 330;
var MAX_TIMEOUT_DELAY = Math.pow(2, 31) - 1;

Polymer({
  is: 'event-card',

  behaviors: [
    Polymer.NeonAnimationRunnerBehavior,
  ],

  properties: {
    eventId: String,
    calendarId: String,
    recurrenceId: String,
    name: String,
    startDateMs: Number,
    endDateMs: Number,
    first: {
      type: Boolean,
      reflectToAttribute: true,
    },
    opened: {
      type: Boolean,
      reflectToAttribute: true,
    },
    starred: {
      type: Boolean,
      reflectToAttribute: true,
      notify: true,
    },
    eventHidden: {
      type: Boolean,
      reflectToAttribute: true,
      notify: true,
    },
    calendarHidden: Boolean,
    color: String,
    link: String,
    animationConfig: {
      value: function () {
        var getAnimationConfig = (function (timing) {
          return [
            {
              name: 'event-collapse-expand-animation',
              node: this.$.collapse,
              maxHeight: COLLAPSE_CONTENT_HEIGHT,
              timing: timing,
            },
            {
              name: 'event-margin-expand-animation',
              node: this.$.material,
              isFirst: (function () {
                return this.first;
              }).bind(this),
              timing: timing,
            },
          ];
        }).bind(this);
        return {
          open: getAnimationConfig({
            duration: 200,
            easing: 'ease-out',
            direction: 'normal',
          }),
          close: getAnimationConfig({
            duration: 200,
            easing: 'ease-in',
            direction: 'reverse',
          }),
        };
      },
    },
    _duration: {
      type: Number,
      value: 0,
    },
    _isStartDuration: {
      type: Boolean,
      value: true,
    },
  },

  observers: [
    '_starChanged(starred)',
    '_hideChanged(eventHidden)',
    '_resetUpdater(startDateMs, endDateMs, opened)',
  ],

  ready: function () {
    this._durationUpdaterId = -1;

    // True for setTimeout, false for requestAnimationFrame.
    this._durationUpdaterIsTimeout = null;
  },

  //
  // Actions
  //

  toggleExpand: function () {
    var opened = !this.opened;
    this.playAnimation(opened ? 'open' : 'close');
    this.fire('event-open-toggled', {
      eventId: this.eventId,
      calendarId: this.calendarId,
      opened: opened,
    });
  },

  toggleStar: function (event) {
    this.starred = !this.starred;
    event.stopPropagation();
  },

  toggleHide: function (event) {
    this.eventHidden = !this.eventHidden;
    event.stopPropagation();
  },

  _updateDuration: function (startDateMs, endDateMs, now) {
    var durationSeconds = Math.floor((startDateMs - now) / 1000);

    if (durationSeconds <= 0) {
      durationSeconds = Math.floor((endDateMs - now) / 1000);

      if (durationSeconds < 0) {
        this.fire('event-finish', {
          calendarId: this.calendarId,
          eventId: this.eventId,
        });
      } else {
        this._isStartDuration = false;
      }
    } else {
      this._isStartDuration = true;
    }

    this._duration = durationSeconds;
  },

  //
  // Getters
  //

  _getElevation: function (opened) {
    return opened ? 2 : 1;
  },

  _getIcon: function (calendarHidden) {
    return calendarHidden ? 'ticktock:calendar-hidden' :
                            'ticktock:calendar';
  },

  _getIconFaded: function (eventHidden, calendarHidden) {
    return eventHidden || calendarHidden;
  },

  _getMajorDurationMax: function (duration) {
    return getMajorDurationMax(duration);
  },

  _getMinorDurationSegments: function (duration) {
    return getDurationSegments(duration).slice(1);
  },

  // Text Getters

  _getNameSuffixText: function (isStartDuration) {
    return isStartDuration ? '' : 'Ends';
  },

  _getMajorDurationText: function (duration) {
    return getDurationSegments(duration, false)[0];
  },

  _getHideButtonText: function (eventHidden) {
    return eventHidden ? 'Unhide' : 'Hide';
  },

  //
  // Observers
  //

  _starChanged: function (starred) {
    if (starred && this.eventHidden) {
      this.eventHidden = false;
    } else {
      this.fire('event-modified', {
        eventId: this.eventId,
        calendarId: this.calendarId,
        starred: this.starred,
        hidden: this.eventHidden,
      });
    }
  },

  _hideChanged: function (hidden) {
    if (hidden && this.starred) {
      this.starred = false;
    } else {
      this.fire('event-modified', {
        eventId: this.eventId,
        calendarId: this.calendarId,
        starred: this.starred,
        hidden: this.eventHidden,
      });
    }
  },

  _resetUpdater: function (startDateMs, endDateMs, opened) {
    if (this._durationUpdaterIsTimeout) {
      clearTimeout(this._durationUpdaterId);
    } else {
      cancelAnimationFrame(this._durationUpdaterId);
    }

    var updateDuration;
    if (opened || needsAnimationFrame(this._duration)) {
      updateDuration = (function () {
        this._updateDuration(startDateMs, endDateMs, Date.now());
        this._durationUpdaterId = requestAnimationFrame(updateDuration);
      }).bind(this);

      this._durationUpdaterId = requestAnimationFrame(updateDuration);
      this._durationUpdaterIsTimeout = false;
    } else {
      updateDuration = (function () {
        this._updateDuration(startDateMs, endDateMs, Date.now());
        var nextUpdate = getNextUpdate(this._duration);
        if (nextUpdate || !needsAnimationFrame(this._duration)) {
          this._durationUpdaterId = setTimeout(updateDuration,
                                               nextUpdate || 200);
        } else {
          this._resetUpdater(startDateMs, endDateMs, opened);
        }
      }).bind(this);

      updateDuration();
      this._durationUpdaterIsTimeout = true;
    }
  },

  //
  // Event Handlers
  //

  _noPropagation: function (event) {
    event.stopPropagation();
  },
});

var S_IN_SECOND = 1;
var S_IN_MINUTE = S_IN_SECOND * 60;
var S_IN_HOUR = S_IN_MINUTE * 60;
var S_IN_DAY = S_IN_HOUR * 24;
var S_IN_MONTH = S_IN_DAY * 30;
var S_IN_YEAR = S_IN_DAY * 365;

var conversionFactors = [
  S_IN_YEAR,
  S_IN_MONTH,
  S_IN_DAY,
  S_IN_HOUR,
  S_IN_MINUTE,
  S_IN_SECOND,
];
var MAX_CONVERSION_FACTOR = S_IN_YEAR * 10;

var units = {};
units[S_IN_SECOND] = 'Second';
units[S_IN_MINUTE] = 'Minute';
units[S_IN_HOUR] = 'Hour';
units[S_IN_DAY] = 'Day';
units[S_IN_MONTH] = 'Month';
units[S_IN_YEAR] = 'Year';

/**
 * Calculate how long until the major duration segment will need updating.
 *
 * @param {Number} seconds - duration in seconds.
 * @return {Number} - milisecond time until the next update.
 */
function getNextUpdate(seconds) {
  var conversionFactor = conversionFactors.find(function (factor) {
    return seconds > factor;
  }) || 1;

  var nextUpdate = (seconds % conversionFactor) * 1000;
  return Math.min(nextUpdate, MAX_TIMEOUT_DELAY);
}

function needsAnimationFrame(seconds) {
  return seconds && seconds <= S_IN_MINUTE;
}

function getDurationSegments(seconds, multiple) {
  multiple = (multiple === undefined) ? true : multiple;
  var segments = [];
  var number;
  for (var i = 0, len = conversionFactors.length; i < len; i++) {
    number = Math.floor(seconds / conversionFactors[i]);

    if (number || i === len - 1) {
      var segment = String(number) + ' ' + units[conversionFactors[i]];
      if (number !== 1) {
        segment += 's';
      }

      if (!multiple) {
        return [segment];
      } else {
        segments.push(segment);
      }
    }

    seconds = seconds % conversionFactors[i];
  }

  return segments;
}

function getMajorDurationMax(seconds) {
  var max;
  for (var i = 0, len = conversionFactors.length; i < len; i++) {
    var number = Math.floor(seconds / conversionFactors[i]);
    if (number) {
      return max || MAX_CONVERSION_FACTOR;
    } else {
      max = conversionFactors[i];
    }
  }

  return 1;
}

})();
