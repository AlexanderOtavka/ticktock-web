/* globals KeyframeEffect */

(function () {
'use strict';

class EventCollapseExpandAnimation {
  get behaviors() {
    return [
      Polymer.NeonAnimationBehavior,
    ];
  }

  beforeRegister() {
    this.is = 'event-collapse-expand-animation';
  }

  configure(config) {
    this._effect = new KeyframeEffect(config.node, [
      {
        height: '0px',
      },
      {
        height: config.maxHeight + 'px',
      },
    ], this.timingFromConfig(config));

    return this._effect;
  }
}

Polymer(EventCollapseExpandAnimation);

})();
