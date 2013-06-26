define([
  'app'
],

function(app) {

  "use strict";

  var Popup = Backbone.TV.View.extend({

  });

  var Box = Backbone.TV.View.extend({
    className: 'box',

    R: {
      template: 'html://<i class="<%= icon %>"></i>'
    },

    _icons: [
      'icon-pinterest', 'icon-twitter', 'icon-facebook',
      'icon-facetime-video', 'icon-github', 'icon-plane',
      'icon-signin', 'icon-magic', 'icon-google-plus'
    ],

    serialize: function() {
      return { icon: this._icons[_.random(0, 8)] };
    },

    render: function() {
      this.$el.append(R.get(this.R.template)(this.serialize()));
    }

  });

  var BoxAnimation = Backbone.TV.View.extend({
    className: 'boxanimation',

    // bind events, create datasource and slider.
    initialize: function() {
      this.on('keydown:left', this.animLeft, this);
      this.on('keydown:right', this.animRight, this);
      this.on('render:after', this.afterRender, this);
    },

    render: function() {
      _.times(5, function(i) {
        var options = {
          attributes:{ style: 'top:' + i * 100 + 'px' }
        };
        this.append( new Box(options) );
      }, this);

      return this;
    },

    afterRender: function() {
      this.focusin();
    },

    animLeft: function() {
      this.startAnimation({ left: '0px' }).done(function(animation) {
        console.log('left animation is done elapsed',
          animation._endTime - animation._startTime);
      });
    },

    animRight: function() {
      this.startAnimation({ left: '700px' }).done(function(animation) {
        console.log('right animation is done elapsed',
          animation._endTime - animation._startTime);
      });
    },

    startAnimation: function(effect) {
      var animOptions = {
        animations: [],
        delay: 0,
        duration: 2
      };

      _.each(this.subviews, function(view) {
        var func = [ 'ease', 'linear', 'ease-in', 'ease-out',
                     'ease-in-out' ][ _.random(1, 4) ];
        var duration = _.random(1, animOptions.duration);
        animOptions.animations.push({
          target: view.$el,
          effect: effect,
          delay: 0,
          duration: duration,
          timingFunction: func
        });
      });

      return Backbone.TV.View.animate(animOptions);
    }

  });

  return BoxAnimation;

});
