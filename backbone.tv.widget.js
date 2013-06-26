//
// backbone.tv.widget. backbone.tv plugins.
//
// copyright 2012, @ragingwind
// use of this source code is governed by a MIT license
//

(function(window) {

  "use strict"

  var Backbone = window.Backbone;
  var DataAttrs = Backbone.TV.DataAttributes;
  var KeyboardEvent = Backbone.TV.KeyboardEvent;

  var BarItem = Backbone.TV.BarItem = function(tag, view, options) {
    tag || (tag = '<sub></sub>');
    options || (options = {});

    this.tag = tag;
    this.view = view;
    _.defaults(this, options);
  };

  //
  // BACKBONE.TV.BARVIEW
  // simple unsorted bar view.
  //

  Backbone.TV.BarView = Backbone.TV.View.extend({
    constructor: function(options) {
      // set default option for barview.
      options = this._attributes(options, DataAttrs.viewtype('barview'));

      _.defaults(options, {
        // key-navigation mode, vertical or horizonal.
        vertical: true,
      });

      _.defaults(this, {
        // current selected baritem with view and options
        _selected: undefined,
        // current hovered baritem with view and options
        _hovered: undefined
      });

      // create primary unsorted list.
      this.$ul = $('<ul></ul>');

      Backbone.TV.View.call(this, options);
    },

    initialize: function() {
      // apply vertical mode to default of direction.
      var vertical = this.options.vertical;

      // define key events by direction value.
      var verticalKeys = 'keydown:up keydown:down';
      var horizotalKeys = 'keydown:right keydown:left';

      this.on('keydown:enter', function() {
        this.select(this._hovered.index);
      }, this);

      this.on(vertical ? verticalKeys : horizotalKeys, function(responder, event) {
        this.traverse(responder, event);
      })

      // trigger derail event with current keyevent, selected and hovered values.
      this.on(vertical ? horizotalKeys :verticalKeys , function() {
        var derailEvent = {
          keyevent: Backbone.TV.KeyboardEvent.event(),
          from: this,
          selected: this._selected,
          hovered: this._hovered
        }

        this.trigger('view:derail', derailEvent);
      }, this);

      // if this view have take focus? set hover to currently selected item.
      this.on('keyevent:focusin', function() {
        this._selected !== undefined && this.hover(this._selected.index);
      }, this);

      // if this view was loosing focus? remove hover from current hovered item.
      this.on('keyevent:focusout', function() {
        this.hover(-1);
      }, this);
    },

    // if args is number, will return baritem in baritems by index
    // or if args is array of baritems? remove exist baritems and then
    // change to new baritems.
    baritems: function() {
      if (_.isNumber(arguments[0])) {
        return this.options.baritems[arguments[0]];
      }
      else if (_.isArray(arguments[0])) {
        // remvoe exist list-items.
        this.$ul.children('li').remove();

        // append new baritesm to this primary ul with index.
        _.each(arguments[0], function(baritem, index) {
          baritem.$li = $('<li>' + baritem.tag + '</li>');
          baritem.index = index;
          this.$ul.append(baritem.$li);
        }, this);
      }

      return this.options.baritems;
    },

    // append default element to view and ~
    render: function() {
      this.$el.append(this.$ul);
      this.baritems(this.options.baritems);
      return this;
    },

    // select specific baritem by index.
    select: function(index) {
      // prevent multiple events to same item
      if (this._selected && this._selected.index === index) {
        return this;
      }

      // pass to listener with current selected and previous related baritem.
      var selectEvent = {
        current: this.baritems(index),
        related: this._selected,
      };

      // add and remove 'select' class to list-item of baritem.
      selectEvent.current.$li.addClass('select');
      selectEvent.related && selectEvent.related.$li.removeClass('select');

      // trigger event after change selected index and take focus.
      this._selected = selectEvent.current;
      this.focusin();
      this.trigger("view:select", selectEvent);

      return this;
    },

    childrens: function(index) {
      if (index != undefined && _.isNumber(index))
        return $(this.$ul.children('li')[index]);
      else
        return this.$ul.children('li');
    },

    // make other hovered item by index
    hover: function(index) {
      var hoverEvent = {
        current: this.baritems(index),
        related: this._hovered
      };

      // add and remove 'hover' class to list-item of baritem.
      hoverEvent.current && hoverEvent.current.$li.addClass('hover');
      hoverEvent.related && hoverEvent.related.$li.removeClass('hover');

      // trigger event after change hovered index to index.
      this._hovered = hoverEvent.current;
      this.trigger('view:hover', hoverEvent);

      return this;
    },

    // traversing circularly each items.
    traverse: function(responder, event) {
      var index = (this._hovered) ? this._hovered.index : -1;
      var max = this.childrens().length;
      var to = (event.keyid == 'up' || event.keyid == 'left');
      var prev = index >= 0 ? index : max - 1;
      var next = prev + (to ? -1 : 1);
      (next == max) ? next = 0 : (next >= 0) || (next = max - 1);

      this.hover(next);

      return true;
    },

    selected: function() {
      return this._selected;
    }

  });

  //
  // BACKBONE.TV.SIDEBARVIEW
  // simple unsorted list view.
  //

  Backbone.TV.SideBarView = Backbone.TV.View.extend({

    constructor: function(options) {
      // set default option for barview.
      options = this._attributes(options, DataAttrs.viewtype('sidebarview'));

      _.defaults(options, {
        // placed on which side
        left: true,
      });

      _.defaults(this, {
        // composited barview.
        barview: undefined,

        // current context view.
        _context: undefined,

        // last selected context.
        _selected: undefined
      });


      Backbone.TV.BarView.call(this, options);
    },

    initialize: function() {
      var barview = this.barview = new Backbone.TV.BarView({
        vertical: true,
        baritems: this.options.baritems
      });

      // binding focus event to drift event to barview
      this.on('keyevent:focusin', function() {
        this.barview.focusin()
      }, this);

      // binding select event to barview
      barview.on('view:select', function(selectEvent) {
        var selected = selectEvent.current;
        var related = selectEvent.related;

        // if the items was selected, context item should be removed.
        if (this._context) {
          this.toggleContext();
        }

        // turn off derail event binding from prev view.
        if (related) {
          related.view.off('view:derail');
        }

        // if selected(detail) view was losing focus, focus should be changed
        // to context or barview.
        selected.view.on('view:derail', function() {
          (this._context) ? this._context.focusin() : this.barview.focusin();
        }, this);

        // passing select event to listener of this view.
        this.trigger('view:select', selectEvent);

      }, this);

      // give focus to context or detail when barview trigger derail event.
      this.barview.on('view:derail', function(e) {
        if ((e.keyevent.keyid == 'left') != this.options.left) {
          (this._context) ? this._context.focusin() : e.selected.view.focusin();
        }
      }, this);

      // binding hotkey to display the context view
      this.on('hkeydown:option', function() {
        this.toggleContext();
      }, this);
    },

    // show and hode context view in baritems. it related with each view in
    // baritem. trigger 'view:context:toggle' event if context has changed.
    toggleContext: function() {
      var show = this._context === undefined;
      if (show) {
        var selected = this.barview.selected();
        if (selected.context === undefined) {
          return;
        }

        // register 'view:derail' event to traverse view in the zone.
        // it will decide where to give the focus, depending on keyevent
        // id value after context view is trigger 'view:derail' event.
        selected.context.on('view:derail', function(derailEvent) {
          var left = this.options.left;
          var key = derailEvent.keyevent.keyid;
          if ((left &&  key == 'left') || (!left && key == 'right')) {
            this.barview.focusin();
          }
          else {
            this.barview.selected() && this.barview.selected().view.focusin();
          }
        }, this);

        // exnted context view with event properties to handle the event.
        this._context = _.extend(selected.context, {
          selected: selected,
          origin: KeyboardEvent.responder()
        });

        this.trigger('view:context:toggle', show, this._context);
      }
      else {
        var context = this._context;
        this._context = undefined;
        context.off('view:derail');
        context.origin && context.origin.focusin();
        this.trigger('view:context:toggle', show, context);
      }
    },

    render: function() {
      this.append(this.barview);
      return this;
    },

    select: function(index) {
      this.barview && this.barview.select(index);
    }

  });

})(this);
