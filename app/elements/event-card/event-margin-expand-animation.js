/* globals KeyframeEffect */

'use strict';

Polymer({
  is: 'event-margin-expand-animation',

  behaviors: [
    Polymer.NeonAnimationBehavior,
  ],

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
  },
});
