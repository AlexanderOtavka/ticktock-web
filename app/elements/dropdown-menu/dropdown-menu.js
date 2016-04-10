'use strict';

Polymer({
  is: 'dropdown-menu',

  properties: {
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
    noPropagation: Boolean,
  },

  listeners: {
    tap: '_onTapped',
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
    requestAnimationFrame(() => this.$.dropdown.open());
  },

  close() {
    requestAnimationFrame(() => this.$.dropdown.close());
  },

  _onTapped(event) {
    if (this.noPropagation) {
      event.stopPropagation();
    }
  },
});
