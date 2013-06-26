define([
  'app'
],

function(app) {

  "use strict";

  var Col = Backbone.TV.View.extend({
    className: 'col',

    R: {
      template: 'html://<i class="<%= icon %>"></i>'
    },

    _icons: [
      'icon-camera', 'icon-font', 'icon-bold',
      'icon-facetime-video', 'icon-fire', 'icon-plane',
      'icon-signin', 'icon-magic', 'icon-legal'
    ],

    serialize: function() {
      return { icon: this._icons[_.random(0, 8)] };
    },

    render: function() {
      this.$el.append(R.get(this.R.template)(this.serialize()));
    }
  });

  var Row = Backbone.TV.View.extend({
    className: 'row',

    render: function(deferred) {
      var view = this;
      for (var i = 0, max = 3; i < max; ++i) {
        var col = new Col();
        this.append(col);
      }

      return this;
    }

  });

  var Thumbnail = Backbone.TV.View.extend({
    className: 'thumbnail',

    initialize: function() {
      this.on('keyup:*', this.keydown, this);
      this.on('render:after', this.afterRender, this);
    },

    render: function() {
      for (var i = 0, max = 3;i < max;++i) {
        var row = new Row();
        this.append(row);
      }

      return this;
    },

    afterRender: function() {
      this.$el.append('<i>Press any keys to refresh</i>');
      this.focusin();
    },

    keydown: function(v, e) {
      // check previous rendering request has completed.
      if (this.isRendering()) {
        console.warn('rendering did not completed');
        return;
      }
      this.clear();
      this.render();
    }
  });

  return Thumbnail;

});
