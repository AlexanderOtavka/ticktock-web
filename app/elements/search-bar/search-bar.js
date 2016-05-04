(function () {
  'use strict';

  Polymer({
    is: 'search-bar',

    properties: {
      searchValue: {
        type: String,
        notify: true,
      },

      isOpen: {
        type: Boolean,
        value: true,
      },
    },

    attached() {
      this.onclick = event => {
        if (this.noPropagation) {
          event.stopPropagation();
          return false;
        }
      };
    },

    open() {
      console.log('Open');
      this.isOpen = true;
    },

    close() {
      console.log('Close');
      this.isOpen = false;
    },

    _onTapped(event) {
      if (this.noPropagation) {
        event.stopPropagation();
      }
    },
  });

})();
