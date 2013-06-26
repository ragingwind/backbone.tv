define([
  'app'
],

function(app) {

	"use strict";

	var WordBlock = Backbone.TV.View.extend({
		className:'detail',

		initialize: function() {
			// focus drift to first word in word blocks.
			this.on('keyevent:focusin', function(e) {
        this.wordsview.subviews[0].focusin()
      }, this);
		},

    // show and hide detail view.
    show: function(show) {
      show ? this.$el.show() : this.$el.hide();
    },

		render: function() {
      // create detail view.
			this.wordsview = new Backbone.TV.View({className:'words'});

      // create subview for each word. set character depend on the
      // order in words. traverse on words, trigger view:derail event
      // if next order is end of left side, if it's not? set focus to next word.
			for (var i = 0; i < this.options.id.length; ++i) {
        var words = this.options.id;
  		  var v = new Backbone.TV.View({
          tagName:'span',
          className:'word',
          order:i
        });

				v.$el.text(words.charAt(i));

				v.on('keydown:left keydown:right', function(r, e) {
					var next = r.options.order + (e.keyid == 'left' ? -1 : 1);
					if (next < 0) {
            this.trigger('view:derail')
          }
					else if (next < words.length) {
						this.wordsview.subviews[next].focusin();
          }
				}, this);

        v.on('keyevent:focusin keyevent:focusout', function(e) {
          this.$el[(e.hasFocus ? 'add' : 'remove') + 'Class']('focus');
        });

				this.wordsview.append(v);
			}

			this.append(this.wordsview);
			return this;
		}
	});

	// contextual view
	var ColorOptionView = Backbone.TV.View.extend({
		className: 'contextual',

    id: 'coloroption',

		initialize: function() {
			this.on('keyevent:focusin', function() {
        if (this.barview.selected() == undefined) {
          this.barview.hover(0);
        }
        this.barview.focusin()
      }, this);
		},

    show: function(show) {
      show && this.focusin();
      show ? this.$el.show() : this.$el.hide();
    },

		render: function() {
      // create barview with colors
			var colors = ['NavajoWhite', 'DarkSalmon', 'PaleGoldenrod', 'AntiqueWhite', 'PowderBlue'];
			var baritems = [];
      var template = _.template('<div class="label" style="background-color:<%= color %>"><%= color %></div>');

			_.each(colors, function(color) {
        var tag = template({color:color});
        baritems.push(new Backbone.TV.BarItem(tag, undefined, {color:color}));
			});

			this.barview = new Backbone.TV.BarView({
        id:'colors',
        vertical:true,
        baritems:baritems
      });

      // trigger event to owner of this context view to changed focus.
			this.barview.on('view:derail', function(derailEvent) {
        this.trigger('view:derail', derailEvent);
      }, this);

      // trigger event to change color.
			this.barview.on('view:select', function(selectEvent) {
				this.trigger('view:select:color', {
          color:selectEvent.current.color
        });
			}, this);

			this.append(this.barview);

			return this;
		}

	});

  // zoneview concept is made according to google tv design pattern.
  // zoneview has three subviews. first view is sidebar, it works like a menu.
  // it was placed to global zone. second view is color option view, put on
  // contextual zone. and last one is wordblock view, it was placed to detail
  // zone to present contents. if you feel need more information? please visit
  // [google tv design patterns#zone] (http://goo.gl/Ljr02)
	var ZoneView = Backbone.TV.View.extend({
		className: 'googletv',

		initialize: function() {
      this.on('render:after', function() { this.sidebar.select(0); }, this)
		},

		render: function() {
			// create color options view to placed contextual zone.
			var coloroption = new ColorOptionView();
      coloroption.on('view:select:color', function(e) {
        var $view = this.sidebar.barview.selected().view.$el;
				$view.css('background-color', e.color);
			}, this);

      this.append(coloroption);

			// create wordblock view with detail zone and context view.
			var sns = ['facebook', 'google-plus', 'github', 'twitter', 'pinterest'];
			var baritems = [];
      var template = _.template('<i class="icon-<%= snsid %>"></i><div class="label"><%= snsid %></div>');

			_.each(sns, function(snsid) {
				var view = new WordBlock({ id:snsid });
        var tag = template({snsid:snsid});

        baritems.push(new Backbone.TV.BarItem(tag, view, {
          context:coloroption
        }));
        this.append(view);
			}, this);

			// create sidebarview to placed global zone.
			var sidebar = this.sidebar = new Backbone.TV.SideBarView({
        baritems:baritems,
        className: 'global'
      });

      // hide previous view and show selected detail view.
      sidebar.on('view:select', function(selectEvent) {
        (selectEvent.related) && selectEvent.related.view.show(false);
        selectEvent.current.view.show(true);
      });

      // toggle context view by show options.
      sidebar.on('view:context:toggle', function(show, context) {
        context.show(show);
        context.selected.view.$el[show ? 'addClass' : 'removeClass']('slide');
      });

			this.append(sidebar);

			return this;
		}
	});

	return ZoneView;
});
