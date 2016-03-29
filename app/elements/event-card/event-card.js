(function () {
'use strict';

const COLLAPSE_CONTENT_HEIGHT = 330;
const MAX_TIMEOUT_DELAY = Math.pow(2, 31) - 1;

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
      value() {
        const getAnimationConfig = timing => [
          {
            name: 'event-collapse-expand-animation',
            node: this.$.collapse,
            maxHeight: COLLAPSE_CONTENT_HEIGHT,
            timing: timing,
          },
          {
            name: 'event-margin-expand-animation',
            node: this.$.material,
            isFirst: () => this.first,
            timing: timing,
          },
        ];

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
  },

  observers: [
    '_resetUpdater(startDateMs, endDateMs, opened)',
  ],

  ready() {
    this._duration = 0;
    this._isStartDuration = true;
    this._durationUpdaterId = -1;

    // True for setTimeout, false for requestAnimationFrame.
    this._durationUpdaterIsTimeout = null;
  },

  //
  // Actions
  //

  toggleExpand() {
    let opened = !this.opened;
    this.playAnimation(opened ? 'open' : 'close');
    this.fire('event-open-toggled', {
      eventId: this.eventId,
      calendarId: this.calendarId,
      opened: opened,
    });
  },

  toggleStar() {
    this.starred = !this.starred;
  },

  toggleHide() {
    this.eventHidden = !this.eventHidden;
  },

  _updateDuration(startDateMs, endDateMs, now) {
    let durationSeconds = (startDateMs - now) / 1000;

    if (durationSeconds <= 0) {
      durationSeconds = (endDateMs - now) / 1000;
      this._isStartDuration = false;
    } else {
      this._isStartDuration = true;
    }

    if (durationSeconds < 0) {
      durationSeconds = 0;
      this.fire('event-finish', {
        calendarId: this.calendarId,
        eventId: this.eventId,
      });
    }

    this._duration = Math.floor(durationSeconds);
  },

  //
  // Getters
  //

  _getElevation(opened) {
    return opened ? 2 : 1;
  },

  _getIcon(calendarHidden) {
    return calendarHidden ? 'ticktock:calendar-hidden' :
                            'ticktock:calendar';
  },

  _getIconFaded(eventHidden, calendarHidden) {
    return eventHidden || calendarHidden;
  },

  _getMajorDurationMax(duration) {
    return getMajorDurationMax(duration);
  },

  _getMinorDurationSegments(duration) {
    return getDurationSegments(duration).slice(1);
  },

  // Text Getters

  _getNameSuffixText(isStartDuration) {
    return isStartDuration ? '' : 'Ends';
  },

  _getMajorDurationText(duration) {
    return getDurationSegments(duration, false)[0];
  },

  _getHideButtonText(eventHidden) {
    return eventHidden ? 'Unhide' : 'Hide';
  },

  //
  // Observers
  //

  _resetUpdater(startDateMs, endDateMs, opened) {
    if (this._durationUpdaterIsTimeout) {
      clearTimeout(this._durationUpdaterId);
    } else {
      cancelAnimationFrame(this._durationUpdaterId);
    }

    if (opened || needsAnimationFrame(this._duration)) {
      let updateDuration = () => {
        this._updateDuration(startDateMs, endDateMs, Date.now());
        this._durationUpdaterId = requestAnimationFrame(updateDuration);
      };

      this._durationUpdaterId = requestAnimationFrame(updateDuration);
      this._durationUpdaterIsTimeout = false;
    } else {
      let updateDuration = () => {
        this._updateDuration(startDateMs, endDateMs, Date.now());
        let nextUpdate = getNextUpdate(this._duration);
        if (nextUpdate || !needsAnimationFrame(this._duration)) {
          this._durationUpdaterId = setTimeout(updateDuration,
                                               nextUpdate || 200);
        } else {
          this._resetUpdater(startDateMs, endDateMs, opened);
        }
      };

      updateDuration();
      this._durationUpdaterIsTimeout = true;
    }
  },

  //
  // Event Handlers
  //

  _onStarButtonTapped(event) {
    this.toggleStar();
    event.stopPropagation();
  },
});

const S_IN_SECOND = 1;
const S_IN_MINUTE = S_IN_SECOND * 60;
const S_IN_HOUR = S_IN_MINUTE * 60;
const S_IN_DAY = S_IN_HOUR * 24;
const S_IN_MONTH = S_IN_DAY * 30;
const S_IN_YEAR = S_IN_DAY * 365;

const conversionFactors = [
  S_IN_YEAR,
  S_IN_MONTH,
  S_IN_DAY,
  S_IN_HOUR,
  S_IN_MINUTE,
  S_IN_SECOND,
];
const MAX_CONVERSION_FACTOR = S_IN_YEAR * 10;

const units = {};
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
  let conversionFactor = conversionFactors.find(factor =>
    seconds > factor
  ) || 1;

  let nextUpdate = (seconds % conversionFactor) * 1000;
  return Math.min(nextUpdate, MAX_TIMEOUT_DELAY);
}

function needsAnimationFrame(seconds) {
  return seconds && seconds <= S_IN_MINUTE;
}

function getDurationSegments(seconds, multiple = true) {
  let segments = [];
  let number;
  for (let i = 0, len = conversionFactors.length; i < len; i++) {
    number = Math.floor(seconds / conversionFactors[i]);

    if (number || i === len - 1) {
      let segment = `${number} ${units[conversionFactors[i]]}`;
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
  let max;
  for (let i = 0, len = conversionFactors.length; i < len; i++) {
    let number = Math.floor(seconds / conversionFactors[i]);
    if (number) {
      return max || MAX_CONVERSION_FACTOR;
    } else {
      max = conversionFactors[i];
    }
  }

  return 1;
}

})();
