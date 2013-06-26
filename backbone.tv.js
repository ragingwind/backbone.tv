//
// backbone.tv
//
// copyright 2012, @ragingwind
// use of this source code is governed by a MIT license
//

(function(root, factory) {
  if (typeof exports !== 'undefined') {
    factory(root, exports, require('lodash'), require('backbone'));
  }
  else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'jquery'], function(_, Backbone, $) {
      factory(root, _, Backbone, $);
    });
  }
  else {
    factory(root, root._, root.Backbone, root.$);
  }
}(this, function(root, _, Backbone, $) {

  // CHECK DEPENDENCIES

  if ( window.Animation === undefined ) {
    throw 'backbone.tv has dependency of Web Animation';
  }

  // BACKBONE.TV
  Backbone.TV = {
    VERSION: '0.0.1'
  }

  //
  // KEYEVENT FOR BACKBONE.TV
  //

  // key code and key code string map.
  var KeyCodes = Backbone.KeyCodes = {
    'left': 37,
    'up': 38,
    'right': 39,
    'down': 40,
    'enter': 13,
    'back': 8,
    'esc': 27,
    // options / alt key
    'option': 18,
    '*': -1
  };

  // pass through to registered delegate when specific keyevent has raise.
  var KeyEvent = function(event, callback, context) {
    this.keycode = -1;
    this.event = event;
    this.horizon = false;
    this.vertical = false;
    this.type = false;
    this.callback = callback;
    this.keyid = '';
    this.context = context;
    this.cancelBubble = false;

    var props = this.event.split(':');

    if (!props.length || props.length < 2)
      throw 'Key event has an invalid format, should be like as "keydown:enter"';

    this.type = props[0];
    this.keyid = props[1];
    this.horizon = (this.keyid == 'left' || this.keyid == 'right');
    this.vertical = (this.keyid == 'up' || this.keyid == 'down');
    this.keycode = KeyCodes[this.keyid];

    if (!this.keycode)
      throw 'Key type has an wrong value, should be used in Backbone.KeyCodes';

    return this;
  }

  // global key event handler for backbone.tv
  var KeyboardEvent = Backbone.TV.KeyboardEvent = {
    // first(front/focus) responder.
    _responder: undefined,

    // key event that raised in the last.
    _event: undefined,

    responder: function() {
      return this._responder;
    },

    event: function() {
      return this._event ? this._event : (this._event = {});
    },

    focusin: function(r) {
      KeyboardEvent._responder = r;
    },

    focusout: function(r) {
      KeyboardEvent.focused(r) && (KeyboardEvent._responder = undefined);
    },

    focused: function(r) {
      return (KeyboardEvent.responder() === r);
    },

    trigger: function(keyevent) {
      var responder = KeyboardEvent.responder();
      var events = [];
      var nodename = keyevent.srcElement && keyevent.srcElement.nodeName;
      var hotkeys = KeyboardEvent._hotkeys;
      var keyevents = responder && responder.keyEvents;

      // prevent keyevent firec from other element except body.
      if (nodename.toUpperCase() !== 'BODY') {
        return this;
      }

      // hotkey dispatch first to handler.
      if (hotkeys && hotkeys[keyevent.which]) {
        events = events.concat(hotkeys[keyevent.which]);
      }

      // key event to front responder view.
      if (keyevents) {
        keyevents = keyevents[-1] ? keyevents[-1] : keyevents[keyevent.which];
        if (keyevents) {
          events = events.concat(keyevents);
        }
      }

      // broadcast keyevents to listeners.
      _.each(events, function(event) {
        if (event.callback && event.type == keyevent.type) {
          // save last key event to KeyboardEvent.
          event.origin = keyevent;
          KeyboardEvent._event = event;
          var ret = event.callback.call((event.context || responder), responder, event);

          // supports cancel event by return value or cancelBubble property.
          // of origin keyke.origin = keyevent event.
          if (ret || event.origin.cancelBubble) {
            keyevent.stopPropagation();
            return false;
          }
          return true;
        }
      }, this);

      return this;
    },

    // add event
    on: function(events, callback, context) {
      var keyEvents = this.keyEvents || (this.keyEvents = {});
      var hotKeyEvents = KeyboardEvent._hotkeys || (KeyboardEvent._hotkeys = {})
      var event;

      events = events.split(/\s+/);
      while (event = events.shift()) {
        if (event.match(/^hkey.*:/)) {
          event = new KeyEvent(event.substring(1), callback, context ? context : this);
          hotKeyEvents[event.keycode] || (hotKeyEvents[event.keycode] = []);
          hotKeyEvents[event.keycode].push(event);
        }
        else {
          event = new KeyEvent(event, callback, context ? context : this);
          keyEvents[event.keycode] || (keyEvents[event.keycode] = []);
          keyEvents[event.keycode].push(event);
        }
      }
    },

    // remove event
    off: function(events, callback, context) {
      if (this.keyEvents === undefined) {
        return;
      }

      var event;
      events = events.split(/\s+/);
      while (event = events.shift()) {
        event = new KeyEvent(event, callback, context ? context : this);
        var keyEvents = this.keyEvents[event.keycode];
        _.all(keyEvents, function(ke) {
          if (ke.event == event.event && ke.callback === event.callback
                && (ke.context && event.context)
                && ke.context.cid == event.context.cid) {
            keyEvents = _.without(keyEvents, ke);
            return true;
          }
        }, this);
        this.keyEvents[event.keycode] = keyEvents;
      }
    },

    bind: function(handler) {
      $(document).ready(function() {
        document.body.onkeydown = handler;
        document.body.onkeyup = handler;
      });
    }

  };

  //
  // BACKBONE.TV UTILITIES
  // utilties for backbone.tv.
  //

  // extend built-in array for subviews traverse.
  _.extend(Array.prototype, {
    // return index of the view in subviews
    index: function(v) {
      return _.indexOf(this, v);
    },

    // circular traverse subviews from the view.
    // if 'to' is 1, function will be return next view in array.
    // or if 'to' is -1, function will be return prev view in array.
    traverse: function(v, to) {
      var index = this.index(v);

      if (index == -1) {
        return undefined;
      }

      if (to === 1)
        index = (index + 1 >= this.length) ? 0 : index + 1;
      else if (to === -1)
        index = (index - 1 < 0) ? this.length - 1 : index - 1;

      return this[index];
    },

    // return next view of the view
    next: function(v) {
      return this.traverse(v, 1);
    },

    // return previous view of the view
    prev: function(v) {
      return this.traverse(v, -1);
    }
  });

  // mixin lodash
  _.mixin({
    // make first letter to capitalized.
    capitalize: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },

    // extract uri to type and resource uri.
    extractUri: function(uri) {
      var i = uri.indexOf('://');
      return (i > 0) ? [uri.substr(0, i), uri.substr(i + 3, uri.length)] : undefined;
    }

  });

  // requestAnimFrame, polyfill requestAnimFrame
  if (window.requestAnimationFrame == undefined) {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                          || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }

  //
  // XHRWebWorker
  // web worker for handling xhr request.
  //

  var XHRWebWorker = function(options) {
    options || (options = {});
    _.defaults(options, {
      path: ''
    });
    this.worker = new Worker(options.path);
    this.worker.addEventListener('message', this.onmessage, false);
    this.worker.requestQueue = {};
  };

  _.extend(XHRWebWorker.prototype, {
    request: function(resource, callback) {
      var message = { type: 'request', method:'GET', url: resource.path };
      var request = { resource:resource, callback:callback };

      // keep resource to request queue.
      if (this.worker.requestQueue[resource.path] === undefined) {
        this.worker.requestQueue[resource.path] = [];
      }
      this.worker.requestQueue[resource.path].push(request);

      // post message with request options.
      this.worker.postMessage(message);
    },

    // handle message from webworker.
    onmessage: function(message) {
      var requests = this.requestQueue[message.data.url];
      if (requests !== undefined && requests.length > 0) {
        var response = message.data.response;
        var contents = response.responseText;
        var status = response.status;
        var xhr = response.xhr;

        _.each(requests, function(request) {
          request.callback(request.resource, contents, status, xhr);
        });

        this.requestQueue[message.data.url] = [];
        delete this.requestQueue[message.data.url];
      }
    }
  });


  //
  // BACKBONE.TV
  // task manager of backbone.tv. control all of execution in backbone.tv
  //

  var Task = Backbone.TV.Task = function( delegate ) {
    delegate = delegate || {};

    _.defaults(delegate, {
      priority: 5,
      run: function() {},
      context: this
    });

    this.delegate = delegate;
  };

  Task.prototype.run = function() {
    var delegate = this.delegate;
    return delegate.run.call(delegate);
  }

  var $tv = Backbone.TV = _.extend(Backbone.TV, {
    // options and delegator functions. it can be used to supply
    // custom options and function.
    options: {
      // path of xhr worker script.
      xhrWebWorker: '../backbone.tv.xhr-worker.js',

      // can be used to supply manipulation of path.
      path: function(type, uri) {
        return uri;
      },

      // by default, template using lodash templating.
      template: function(context) {
        return _.template(context);
      }
    },

    // shortcut function of path.
    path: function(type, uri) {
      return $tv.options.path(type, uri)
    },

    // shortcut function of template.
    template: function(context) {
      return $tv.options.template(context);
    },

    // save manifest to download resources.
    taskQueue: [],

    request: function( opts, done ) {
      this.xhrWebWorker.request( opts, done );
    },

    // configure options, going to start task loop and
    // xhrWebworker thread.
    configure: function(options) {
      // we used to supply default values and functions.
      var props = ['path', 'template', 'xhrWebWorker'];
      _.each(props, function(p) {
        options[p] && (this.options[p] = options[p]);
      }, this);

      // create xhrWebworker and bind event.
      if (this.options.xhrWebWorker.length > 0) {
        this.xhrWebWorker = new XHRWebWorker({ path: this.options.xhrWebWorker });
      }

      // bind keyevent handler to backbone.tv keybord event handler.
      KeyboardEvent.bind(function(keyevent) {
        _.extend(keyevent, {
          run: function() {
            KeyboardEvent.trigger( this );
          }
        });

        $tv.submit( new Task( keyevent ) );
      });

      // start task loop.
      (function taskLoop(){
        Backbone.TV.run();
        requestAnimationFrame(taskLoop);
      })();
    },

    // taskLoop going to run this function.
    run: function() {
      if (this.taskQueue.length == 0) {
        return;
      }

      var task = this.taskQueue.shift();
      task.run();
    },

    submit: function(task) {
      this.taskQueue.push(task);
    }
  });

  //
  // BACKBONE.TV.R
  // resource manager of backbone.tv. this manager cache all resource
  // and manage the lifecycle of resources.
  //

  var Resource = function(props) {
    props || ( props = {} );
    _.defaults(this, props);
  }

  Resource.prototype.resolve = function() {
    this.deferred.retain--;
    if (this.deferred.retain == 0) {
      this.deferred.resolveWith(this.context || this.deferred, arguments);
    }
  }

  Resource.prototype.run = function() {
    var contents = R.cache(this.path);
    if ( contents !== undefined ) {
      this.resolve( contents, 'success', this );
    } else
    if ( contents === undefined) {
      R.fetch(this, function(resource, contents, status) {
        if (status === 'success') {
          R.cache(resource.path, contents);
        }
        else {
          console.error('Download this is failed', resource.path);
        }
        resource.resolve( contents, status, resource );
      });
    }
  }

  window.R = Backbone.TV.R = _.extend({
    // cached downloaded resource by url.
    _cache: {},

    // fetch template resource by using webworker or ajax.
    fetchTemplate: function(resource, callback) {
      if ($tv.xhrWebWorker) {
        $tv.request(resource, function(resource, contents, status, xhr) {
          callback(resource, Backbone.TV.template(contents), status);
        });
      }
      else {
        $.ajax({ url: resource.path, async: false }).then(
          function(contents, status, xhr) {
            callback(resource, Backbone.TV.template(contents), status);
          }
        );
      }
    },

    // fetch image resource using Image object.
    fetchImage: function(resource, callback) {
      // bind load and error event. this event will trigger
      // when image was downloaded successfully or we've got error.
      var img = new Image();
      $(img).bind('load', function() {
        callback(resource, img, 'success'); })
            .bind('error', function() { callback(resource, img, 'error'); });

      // set image path to download.
      img.src = resource.path;
    },

    // make raw html to template object and it will be cached.
    fetchHtml: function(resource, callback) {
      callback(resource, Backbone.TV.template(resource.path), 'success');
    },

    fetch: function(resource, callback) {
      // get fetch handler by resource type.
      var type = _.capitalize(resource.type)
      var fetchHandler = this['fetch' + type];
      if (fetchHandler === undefined) {
        throw 'Taget fetch handler is not exsit ' + 'fetch' + type;
      }

      // call fetch handler depend on resource type.
      fetchHandler(resource, callback);
    },

    load: function(target, context) {
      var resources;
      var deferred = $.Deferred();

      // add retain count to deferred as attribute for download counting.
      deferred.retain = 0;

      // regenerate target to resource array.
      if ( _.isArray( target ) ) {
        resources = target;
      } else if ( _.isObject( target ) ) {
        resources = _.values( target );
      } else if ( _.isString( target ) ) {
        resources = [ target ];
      } else {
        throw 'Unknown resource type.';
      }

      // create resource and submit resource task, it is going to fetch
      // resource by each type of resource. if resource download had finished
      // in successfully, the resource is going to cached if it's not cached.
      _.each(resources, function(resource) {
        var uri = _.extractUri( resource ), resource;
        deferred.retain++;
        resource = new Resource({ type: uri[0], path: $tv.path(uri[0], uri[1]),
                                  context: context, deferred: deferred });

        $tv.submit( new Task( resource ) );
      }, this);

      // return deferred with retain count.
      return deferred;
    },

    cache: function(path, contents) {
      // if contents has a data, update contents by path.
      if (path !== undefined && contents !== undefined) {
        this._cache[path] = contents;
      }
      return this._cache[path];
    },

    // return cached resource using computed path.
    get: function(resource) {
      var uri = _.isObject( resource ) ? _.value( resource ) : resource;
      uri = _.extractUri( uri );
      return this.cache($tv.path(uri[0], uri[1]));
    }

  }, Backbone.Events);

  //
  // BACKBONE.TV.DATAATTRIBUTES
  // data attributes preset for backbone.tv.
  //

  var DataAttrs = Backbone.TV.DataAttributes = {
    _prefix: 'data-backbonetv',

    _json: function(name, value) {
      return JSON.parse( ['{"', name, '":"', value, '"}'].join('') );
    },

    viewtype: function(typename) {
      return this._json(DataAttrs._prefix + '-viewtype', typename);
    }
  };

  //
  // BACKBONE.TV.VIEW
  // common view for backbone.tv. this view has a basic feature
  // to handle event view management.
  //

  Backbone.TV.View = Backbone.View.extend({
    // setup default properties and set up tv.view
    constructor: function(options) {
      // set default attributes to options.
      options = this._attributes(options, DataAttrs.viewtype('view'));

      _.defaults(this, {
        subviews: [],
        superview: undefined,
        renderDeferreds: {},
      });

      Backbone.View.call(this, options);
    },

    // return options with backbonetv-viewtype attribute.
    _attributes: function(options, attributes) {
      options = options || {};
      options.attributes = options.attributes || {};

      // set view type data attribute.
      _.defaults(options.attributes, attributes);

      return options;
    },

    // override default event bind function on of Event of backbone.
    on: function(events, callback, context) {
      var keyevent = /^(h|)key(down|up):/.test(events);
      var event = keyevent ? KeyboardEvent : Backbone.Events;
      event['on'].call(this, events, callback, context);
      return this;
    },

    // override default event bind function off of Event of backbone.
    off: function(events, callback, context) {
      var keyevent = /^(h|)key(down|up):/.test(events);
      var event = keyevent ? KeyboardEvent : Backbone.Events;
      event['off'].call(this, events, callback, context);
      return this;
    },

    // view will be gain focus.
    focusin: function() {
      // focus out of prev responder.
      var responder = KeyboardEvent.responder();
      responder && responder.focusout(this);

      // focus into current responder and trigger event.
      KeyboardEvent.focusin(this);
      this.trigger('keyevent:focusin', { hasFocus: true });
      return this;
    },

    // view will be loose focus.
    focusout: function(responder) {
      this.trigger('keyevent:focusout', { hasFocus: false });
      KeyboardEvent.focusout(this);
      return this;
    },

    // trigger event to notify focus changed.
    focused: function() {
      return KeyboardEvent.focused(this);
    },

    // return index of view in subviews in superview.
    indexOf: function() {
      return this.superview ? _.indexOf(this.superview.subviews, this) : -1;
    },

    // set view to superview with sibling view and element insertion type.
    set: function(subview, sibling, append) {
      if (subview instanceof Backbone.TV.View == false) {
        throw 'Subview is must be instance of Backbone.TV.View';
      }

      if (sibling !== undefined && sibling instanceof Backbone.TV.View == false) {
        throw 'Target view is must be instance of Backbone.TV.View';
      }

      var subviews = this.subviews;

      // insert view to subviews by index.
      var index = sibling === undefined ? subviews.length : sibling.indexOf() + 1;
      subviews.splice(index, 0, subview);

      // set superview to subview.
      subview.superview = this;

      subview.insertElement = function() {
        var methods = ['append', 'insertAfter', 'insertBefore'];
        var method = (sibling === undefined) ? 0 : (append) ? 1 : 2;
        var caller = (sibling) ? subview : subview.superview;
        var target = (sibling) ? sibling : subview;
        var $el = (sibling) ? sibling.$el : subview.$el;
        caller.$el[ methods[method] ]($el);
      };

      // complete render deferred processing after out of deferred queue.
      function renderDone(view, cid) {
        // determine cid of view.
        cid = cid ? cid : view.cid;

        // remove render deferred by cid.
        delete view.renderDeferreds[cid];

        // calculate deferred count, if size is zero, that mean is
        // subview rendering is completed.
        if (_.size(view.renderDeferreds) === 0) {
          // check whether procedure type is sequential or not.
          // if it type is sequential, should be resolving the deferred of
          // superview to complete render sequence.
          var superview = view.superview;
          var deferred = superview && superview.renderDeferreds[view.cid];
          var inserter = view.insertElement;

          // resolve render deferred to completed rendering.
          if (superview !== undefined && deferred !== undefined) {
            deferred.resolve(superview, view.cid);
          }

          // trigger event of rendering.
          view.trigger('render:after');
        }
      }

      // clone orgin render function.
      subview._render = subview.render;

      // replace render function, create custrom render function to
      // make deferred process. this subview has custom render function after
      // append.
      subview.render = function() {
        // create render deferred for rendering of subview and
        // register callback, that is called when rendering is completed.
        subview.renderDeferreds[subview.cid] = $.Deferred();
        subview.renderDeferreds[subview.cid].done(renderDone);

        // create another deferred to synchronize rendering with subview and
        // register callback, that is called by subview when rendering
        // is completed of subviews of this subview.
        subview.superview.renderDeferreds[subview.cid] = $.Deferred();
        subview.superview.renderDeferreds[subview.cid].done(renderDone);

        // request template to rendering.
        var resourceDeferred = undefined;
        if (subview.R) {
          resourceDeferred = R.load(subview.R, this);
        }

        var viewRender = function(view) {
          view || (view = this);

          // trigger event of rendering to stored view
          view.trigger('render:before');

          if (_.isFunction(view.insertElement)) {
            view.insertElement.call();
            delete view.insertElement;
          }

          // call backed up render function.
          view._render();

          // resolve own renderDeferreds object.
          view.renderDeferreds[view.cid].resolve(view);

          // delete resource deferred.
          delete resourceDeferred;
        };

        // subview will be rendering after has downloaded resource
        // if view has no resource, subview is rendering immediately.
        if (resourceDeferred) {
          resourceDeferred.done(function( contents, status, resource ) {
            viewRender( resource.context );
          });
        }
        else {
          viewRender(subview);
        }

        return this;
      }
      // call render delegate function of subview.
      return subview.render();
    },

    // insert subview to last positon of this view.
    append: function(subview) {
      return this.set(subview, this.subviews[this.subviews.length - 1], true);
    },

    // insert subview to first positon of this view.
    prepend: function(subview) {
      return this.set(subview, this.subviews[0], false);
    },

    // remove view from superview
    remove: function() {
      // remove all subview.
      this.clear();

      // call backbone's remove function.
      Backbone.View.prototype.remove.call(this);

      // remove this view from superview.
      this.superview.subviews = _.without(this.superview.subviews, this);
    },

    clear: function() {
      // clean subviews element.
      _.each(this.subviews, function(v) {
        v.remove();
      });

      // empty child elements.
      return this.$el.empty();
    },

    // return true if view has not completed of render
    // it mean is stil process subviews rendering.
    isRendering: function() {
      return _.size(this.renderDeferreds) !== 0;
    },

  });

  //
  // BACKBONE.TV.VIEW STATIC
  //
  Backbone.TV.View.animate = function(options) {
    var group, startTime;
    var animations = options.animations;

    // prepare animation array.
    if (!animations) {
      animations = []
      animations.push( options );
    }

    // create animations with group. it's only supports ParGroup currently,
    // ignore timing arguments and convert delay time to startTime for group.
    startTime = options.delay >= 0.5 ? options.delay : undefined;
      group = new ParGroup( [], options.duration, undefined, startTime );

    // create Animation after properties correcting.
    _.each( animations, function( anim ) {
      anim.target = anim.target instanceof jQuery ? anim.target[0] : anim.target;
      anim.startDelay = anim.delay || 0;
      new Animation( anim.target, anim.effect, anim, group );
    });

    // make keep only one deferred of animation per each element.
    group.animDeferred = $.Deferred();

    // start animation with the group animation
    document.timeline.play(group);

    return group.animDeferred.promise();
  }

  //
  // BACKBONE.TV.SCREEN
  // window contains your app's visible content. user can make
  // only one window.
  //

  Backbone.TV.Screen = Backbone.TV.View.extend({
    // preparing screen environment.
    constructor: function(options) {
      // set screen view type to options.
      options = this._attributes(options, DataAttrs.viewtype('screen'));
      Backbone.TV.View.call(this, options);
    },

    render: function() {
      // remove screen was created if in there.
      if (this.screen().length > 0) {
        this.screen().remove();
      }

      // append screen element.
      var $screen = this.$el;
      $('body').append(this.$el).promise().done(function() {
        $screen.css('position', 'absolute')
              .css('left', '0')
              .css('top', '0')
              .css('width', $(window).width())
              .css('height', $(window).height())
              .css('background-color', 'rgba(10,10,10,0.1)');
      });

      return this;
    },

    screen: function() {return $('div[data-backbonetv-viewtype=screen]');},

    rootView: function(v) {
      this._rootView || (this._rootView = {});

      if (v !== undefined) {
        this.clear();
        this.append(v);
        this._rootView = v;
      }

      return this._rootView;
    }
  });

  return Backbone;
}));
