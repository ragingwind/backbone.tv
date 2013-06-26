define([
  'app'
],

function(app) {

  "use strict";

  var Examples = Backbone.TV.View.extend({
    className: 'examples',

    R: {
      template: 'template://examples.html'
    },

    initialize: function() {
      this.examples = [];
      this.cursor = 0;
      this.on('render:after', this.afterRender);
      _.bindAll(this);
    },

    render: function() {
      this.$el.append(R.get(this.R.template)());
      var examples = this.$el.find(".examples-list li");
      for (var i = 0, max = examples.length; i < max; ++i) {
        // create backbone.tv.view with exist items
        var t = new Backbone.TV.View({el:examples[i], order:i});
        t.on('keydown:enter', this.selected, this);
        t.on('keydown:up keydown:down', this.traverse, this);
        t.on('keyevent:focusin keyevent:focusout', function(e) {
          this.$el[(e.hasFocus ? 'add' : 'remove') + 'Class']('focus');
        });
        this.examples.push(t);
      }
      console.log( 'focus' );
      return this;
    },

    traverse: function(v, e) {
      console.log( this.examples, this.cursor );
      this.cursor = this.cursor += (e.keyid == 'up' ? -1 : 1);
      if (this.cursor < 0) {
        this.cursor = this.examples.length - 1;
      } else {
        this.cursor = this.cursor % this.examples.length;
      }
      this.examples[this.cursor].focusin();
    },

    afterRender: function() {
      console.log( 'afterRender', this.examples );
      this.examples[0].focusin();
      return this;
    },

    selected: function(v, e) {
      var id = v.$el.attr('data-example-id');
      app.router.navigate('#' + id);
    },
  });

  return Examples;

});
