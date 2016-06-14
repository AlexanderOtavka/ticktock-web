/* globals EventGroup, CompositeEventLine */

(function () {
'use strict';

class CompositeEventGroup extends EventGroup {
  constructor(manager, calendar, filters, ...children) {
    super(manager, calendar, filters);
    this._children = [];
    children.forEach(child => this.addChild(child));
  }

  get children() {
    return this._children;
  }

  addChild(child) {
    assert(child instanceof EventGroup);
    child.setParent(this);
    this.children.push(child);

    this._performLineOp(line => line.maybeAddChild(child));
  }

  _createEventLine(filters) {
    let { hidden, search, calendarHidden } = filters;
    let unhiddenOnly = calendarHidden === false;
    let line = new CompositeEventLine(this._calendar, filters, this.children);

    if (!search && hidden === false && unhiddenOnly) {
      this._unhidden = line;
    } else if (!search && !hidden && unhiddenOnly) {
      this._all = line;
    } else {
      this._virtual = line;
    }

    return line;
  }
}

window.CompositeEventGroup = CompositeEventGroup;

})();
