(function () {
'use strict';

let _modules = {};

class Module {
  static require(moduleName) {
    return (_modules[moduleName] || {}).exports;
  }

  constructor(name) {
    this.name = name;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    delete _modules[this._name];
    _modules[name] = this;
    this._name = name;
  }
}

window.Module = Module;

})();
