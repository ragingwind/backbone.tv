define([
  'app'
],

function(app) {
  var cound = 0;
  var CardView = Backbone.TV.View.extend({

    className:'cardview',

    R: {
      template: 'html://<i class="icon-<%= icon %>"></i>'
    },

    _icons: [
      'camera', 'font', 'bold', 'facetime-video', 'fire', 'plane', 'signin',
      'magic', 'legal', 'facebook', 'google-plus', 'github', 'twitter', 'pinterest'
    ],

    initialize: function() {
      this.icon = this._icons[_.random(0, 8)];
      this.id = this.icon + new Date().getMilliseconds();
    },

    serialize: function() {
      return { icon: this.icon };
    },

  	render: function() {
      this.$el.append(R.get(this.R.template)(this.serialize()));
  		return this;
    }

  });

  var CardFlowView = Backbone.TV.View.extend({

  	className: 'cardflowview',

    id: 'cardflowview',

    initialize: function() {
      this.options || (this.options = {});
      _.defaults(this.options, {
        max: 5,
        min: 1
      });

      this.on('keydown:left keydown:right', this.navigate, this);
  	},

  	navigate: function(v, e) {
      this[(e.keyid === 'left') ? 'enqueue' : 'dequeue']();
  	},

  	enqueue: function() {
      if (this.subviews.length >= this.options.max) {
        this.subviews[this.subviews.length - 1].remove();
      }
      this.prepend(new CardView());
  	},

    dequeue: function() {
      if (this.subviews.length <= this.options.min) {
        return;
      }

      var card = this.subviews[0];
      card.$el.animate({ 'opacity': 0.5 }, {
        duration: 100,
        complete: function() { card.remove(); }
      });
  	},

    render: function() {
      for (var i = 0; i < this.options.max; ++i) {
        this.enqueue();
      }
      return this;
    }
  });

  var Homescreen = Backbone.TV.View.extend({

  	className:'homescreen',

    id: 'homescreen',

  	initialize: function() {
  	},

    render: function() {
      this.cardflow = new CardFlowView();
      this.append(this.cardflow);
      this.cardflow.focusin();
  		return this;
  	}

  });

  return Homescreen;

});
