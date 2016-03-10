(function () {
'use strict';

class DropdownMenu {
  beforeRegister() {
    this.is = 'dropdown-menu';

    this.properties = {
      verticalAlign: {
        type: String,
        value: 'top',
      },
      verticalOffset: Number,
      horizontalAlign: {
        type: String,
        value: 'right',
      },
      horizontalOffset: Number,
      disabled: Boolean,
      openAnimationConfig: {
        type: Array,
        value: () => [
          {
            name: 'fade-in-animation',
            timing: {
              delay: 150,
              duration: 50,
            },
          },
          {
            name: 'dropdown-expand-animation',
            timing: {
              delay: 150,
              duration: 200,
            },
          },
        ],
      },
      closeAnimationConfig: {
        type: Array,
        value: () => [
          {
            name: 'fade-out-animation',
            timing: {
              duration: 200,
            },
          },
        ],
      },
      opened: {
        type: Boolean,
        notify: true,
      },
    };
  }

  open(event) {
    setTimeout(() => {
      this.$.dropdown.open();
    }, 20);

    event.stopPropagation();
  }
}

Polymer(DropdownMenu);

})();