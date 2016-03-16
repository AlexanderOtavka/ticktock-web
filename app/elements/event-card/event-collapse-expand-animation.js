/* globals KeyframeEffect */

(function () {
'use strict';

Polymer({
  is: 'event-collapse-expand-animation',

  behaviors: [
    Polymer.NeonAnimationBehavior,
  ],

  configure(config) {
    this._effect = new KeyframeEffect(config.node, [
      {
        height: '0px',
      },
      {
        height: `${config.maxHeight}px`,
      },
    ], this.timingFromConfig(config));

    return this._effect;
  },
});

})();
