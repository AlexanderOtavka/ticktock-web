/* globals KeyframeEffect */

(function () {
'use strict';

class DropdownExpandAnimation {
  get behaviors() {
    return [
      Polymer.NeonAnimationBehavior,
    ];
  }

  beforeRegister() {
    this.is = 'dropdown-expand-animation';
  }

  configure(config) {
    let node = config.node;
    let height = node.getBoundingClientRect().height;
    this._effect = new KeyframeEffect(node, [
      { height: (height / 2) + 'px' },
      { height: height + 'px' },
    ], this.timingFromConfig(config));
    return this._effect;
  }
}

Polymer(DropdownExpandAnimation);

})();
