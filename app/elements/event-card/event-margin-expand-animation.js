/* globals KeyframeEffect */

(function () {
'use strict';

class EventMarginExpandAnimation {
  get behaviors() {
    return [
      Polymer.NeonAnimationBehavior,
    ];
  }

  beforeRegister() {
    this.is = 'event-margin-expand-animation';
  }

  configure(config) {
    this._effect = new KeyframeEffect(config.node, [
      {
        marginTop: '0px',
        marginBottom: '0px',
      },
      {
        marginTop: config.isFirst() ? '0px' : '16px',
        marginBottom: '16px',
      },
    ], this.timingFromConfig(config));
    return this._effect;
  }
}

Polymer(EventMarginExpandAnimation);

})();
