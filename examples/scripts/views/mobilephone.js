define([
  'app'
],

function(app) {

	"use strict";

	var NaviBar = Backbone.TV.View.extend({
		className:'navibar',

    initialize: function() {
			// focus drift, to first subview
			this.on('keyevent:focusin', function() { this.subviews[0].focusin() }, this);
		},

		render: function() {
			// create subviews
			var button = function(title, icon) {
				return '<div class="navibutton"><i class="' + icon + '"></i>' + title + '</div>';
			}

			var left = this.leftButton = new Backbone.TV.View({el:button(' Home', 'icon-home')});
			left.on('keydown:right', function() {right.focusin()}, this);
			left.on('keydown:down', function() {this.superview.focusin()}, this);
      left.on('keyevent:focusin keyevent:focusout', function(e) {
        this.$el[(e.hasFocus ? 'add' : 'remove') + 'Class']('focus');
      });

			var right = this.rightButton = new Backbone.TV.View({el:button(' Next', 'icon-caret-right')});
			right.on('keydown:left', function() {left.focusin()}, this);
			right.on('keydown:down', function() {this.superview.focusin()}, this);
      right.on('keyevent:focusin keyevent:focusout', function(e) {
        this.$el[(e.hasFocus ? 'add' : 'remove') + 'Class']('focus');
      });

			this.append(left);
			this.append(right);

			return this;
		},

    buttons: function() {
			return {
				left:this.leftButton,
				right:this.rightButton
			}
		}
	});

	var WordBlock = Backbone.TV.View.extend({

    className: 'wordblock',

		initialize: function() {
			// focus drift to first word block.
			this.on('keyevent:focusin', function() { this.subviews[1].focusin(); }, this);
		},

		render: function() {
			// navibar, put on top of this view.
			var navibar = new NaviBar();
			this.append(navibar);

			navibar.buttons().left.on('keydown:enter', function(r, e) {
				window.open(this.options.url);
			}, this);

			navibar.buttons().right.on('keydown:enter', function(r, e) {
				this.superview.trigger('wordblock:next', this);
			}, this);

			// make word view
			for (var i = 0; i < this.options.id.length; ++i) {
				var v = new Backbone.TV.View({
            tagName:'span',
            className:'word',
            order:i
          });
				var words = this.options.id;

				v.$el.text(words.charAt(i));

				// set event to traverse on word
				v.on('keydown:left keydown:right', function(r, e) {
					var next = r.options.order + (e.keyid == 'left' ? -1 : 1)
						,	max = words.length;

						(next == max) ? next = 0 : (next >= 0) || (next = max - 1);
						this.subviews[next + 1].focusin();
				}, this);

				// keydown with up key, navibar has focus.
				v.on('keydown:up', function() { this.subviews[0].focusin(); }, this);

        // keydown with down key, return focus to superview.
				v.on('keydown:down', function() { this.superview.focusin(); }, this);

        // handle focus event
        v.on('keyevent:focusin keyevent:focusout', function(e) {
          this.$el[(e.hasFocus ? 'add' : 'remove') + 'Class']('focus');
        });

				this.append(v);
			}
			return this;
		}
	});


	return Backbone.TV.View.extend({
		className: 'mobilephone',

    initialize: function() {
      this.on('render:after', function() {
        this.tabbar.select(0);
      }, this);
		},

		render: function(data) {
      // create (tab)barview with baritems with (wordblock)views.
			var baritem = function(id, url, className) {
				return {
					view: new WordBlock({className: className, id:id, url:url}),
					url:url,
					item: '<i class="icon-' + id + '"></i>'
				}
			}

      var tabbarOptions = {
        className: 'mobilephone',
        baritems: [],
        vertical:false,
        id:'tabbar'
      }

      // preset of wordblock view options.
      var wordblockOptions = [
        {id: 'facebook', url: 'http://facebook.com' },
        {id: 'google-plus', url: 'https://plus.google.com/' },
        {id: 'github', url: 'http://github.com' },
        {id: 'twitter', url: 'http://twitter.com' },
        {id: 'pinterest', url: 'http://pinterest.com' },
      ];

      _.each(wordblockOptions, function(opt) {
        var view = new WordBlock(opt);
        var tag = '<i class="icon-' + opt.id + '"></i>';
        opt.className = 'wordblock';
        tabbarOptions.baritems.push(new Backbone.TV.BarItem(tag, view));
      });

      // create tabbar with baritems by horizontal mode.
			var tabbar = this.tabbar = new Backbone.TV.BarView(tabbarOptions);

			// add wordblock view to tabbar that view had associated with baritems.
			_.each(tabbarOptions.baritems, function(baritem) {
        tabbar.append(baritem.view);
      }, this);

			// handle view:select event. apply add, remove and focusin
      // functions to baritem.
			tabbar.on('view:select', function(selectEvent) {
        // remove visibled class from previous wordblock view.
				selectEvent.related && selectEvent.related.view.$el.removeClass('visibled');

				// set visible attribute to selected wordblock view.
				selectEvent.current.view.$el.addClass('visibled');
				selectEvent.current.view.focusin();
			});

			// if tabbar has been losing focus with up keyid then give focus to
      // wordblock view of selected baritem.
			tabbar.on('view:derail', function(derailEvent) {
				if (derailEvent.keyevent.keyid === 'up') {
          derailEvent.selected.view.focusin();
				}
			});

			// handle next event from wordblock. that event fired from subview.
      // select next word in wordblock
			tabbar.on('wordblock:next', function(wb) {
        this.select(this.subviews.next(wb).indexOf());
			}, this.tabbar);

			this.append(tabbar);

			return this;
		}
	});
});
