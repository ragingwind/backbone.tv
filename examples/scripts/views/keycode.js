define([
  'app'
],

function(app) {

	"use strict";

	var KeyCode = Backbone.TV.View.extend({
		className: 'keycode',

		initialize: function() {
			this.on('keydown:*', this.keydown, this);
      this.on('render:after', function() {
        this.focusin();
      });
		},

		render: function(data) {
			this.$el.text('Please press any keys.');
			return this;
		},

		keydown: function(v, e) {
			var o = e.origin;
			this.$el.text(['keyCode:', o.keyCode, 'id:', o.keyIdentifier].join(' '));
		}
	});

	return KeyCode;

});
