/* globals KeyframeEffect */

(function () {
'use strict';

Polymer({
  is: 'dropdown-expand-animation',

  behaviors: [
    Polymer.NeonAnimationBehavior,
  ],

  configure(config) {
    let node = config.node;
    let height = node.getBoundingClientRect().height;
    this._effect = new KeyframeEffect(node, [
      { height: `${(height / 2)}px` },
      { height: `${height}px` },
    ], this.timingFromConfig(config));
    return this._effect;
  },
});

})();
