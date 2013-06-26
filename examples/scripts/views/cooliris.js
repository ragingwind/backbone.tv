define([
  'app'
],

function(app) {

  "use strict";

  var Images = [
    'image://http://media-cache-lt0.pinterest.com/upload/159596380516754443_jzTxwQlS_c.jpg',
    'image://http://media-cache-is0.pinimg.com/550x/da/71/99/da7199c2f8775b13851d323fcdf02052.jpg',
    'image://http://media-cache-ec4.pinterest.com/upload/16818198580046845_KfqleauN_c.jpg',
    'image://http://media-cache-ec2.pinterest.com/upload/282178732874372119_9Rx3E5hX_c.jpg',
    'image://http://media-cache-ec5.pinterest.com/upload/244320348506604316_w0DfcIND_c.jpg',
    'image://http://media-cache-ec2.pinterest.com/upload/13933080069065202_nSrpDvkI_c.jpg',
    'image://http://media-cache-ec6.pinterest.com/upload/32510428529915840_F3oydjjM_c.jpg',
    'image://http://media-cache-lt0.pinterest.com/upload/174936766746921483_LZrnKJlS_c.jpg'
  ];

  // display, insert, remove, reload, shift, unshiftm push and pop slides that
  // in be collection. you can make slide contents to left or right.
  var SliderView = Backbone.TV.View.extend({
    initialize: function() {
      this.on('render:after', this.afterRender, this);

      this.datasource = this.options.collection;
      this.datasource.on('add', this._datasourceDidAdd, this)
                     .on('remove', this._datasourceDidRemove, this);

      // extend utility jquery fn
      (function($){
        $.fn.boundary = function() {
          var pos = this.position();
          return {
            left: pos ? pos.left - $(this).width() : 0,
            right: pos ? pos.left + $(this).width() : 0
          };
        }

        $.fn.exists = function () {
          return this.length !== 0;
        }
      })(jQuery);
    },

    // insert new slide with new model.
    _datasourceDidAdd: function(model) {
      model.on('change', this.update, this);
      this.insert(model);
    },

    // remove slide by removed model
    _datasourceDidRemove: function(model) {
      this.remove(model);
    },

    // generate slide template.
    _slide: function(index) {
      var model = this.datasource.at(index);
      var contents = $(model.get('contents')).clone(true);
      return $('<div></div>').attr({ 'data-cid': model.cid })
                             .css({ 'position': 'absolute' })
                             .append(contents);
    },

    // return slide length in visiblity.
    length: function() {
      return this.$el.children().length;
    },

    // remove all children.
    clean: function() {
      this.$el.empty();
    },

    // reload slide from zero, if slider is empty, or it's not empty?
    // reload slide from current front position.
    reload: function(max) {
      var start = this.length() === 0 ? 0 : this.front().index;
      max = _.min([ start + max, this.datasource.length - 1 ]);
      this.clean();
      for (; start < max; ++start) {
        this._insertAfter(undefined, this._slide( start ));
      }
      return this;
    },

    // return cid from element attribute.
    getByCid: function(cid) {
      return this.$el.find('[data-cid="' + cid + '"]')[0];
    },

    // get model from datasource by element attribute.
    getModelByElement: function(elem) {
      return this.datasource.getByCid( $(elem).attr('data-cid') );
    },

    // return index and model at front.
    front: function() {
      var elem = this.$el.children()[0];
      var model = this.getModelByElement(elem);
      return {
        index: model ? this.datasource.indexOf(model) : -1,
        model : model
      };
    },

    // insert slide after the element. if the element is undefined?
    // the slide goint to append to parent element.
    _insertAfter: function(elem, slide) {
      var delegate = {
        elem: elem,
        parent: this.$el,
        left: elem ? $(elem).boundary().right : 0,
        slide: slide,
        call: function() {
          this.slide.css({ left: this.left });
          this.elem ? $(this.elem).after(slide) : this.parent.append(slide);
        }
      }

      this.trigger('sliderview:addto', delegate);
    },

    // insert slide before the elelemt. the element must be exist.
    _insertBefore: function(elem, slide) {
      var delegate = {
        elem: elem,
        left: $(elem).boundary().left - slide.width(),
        slide: slide,
        call: function() {
          this.slide.css({ left: this.left });
          $(this.elem).before(this.slide);
        }
      }

      this.trigger('sliderview:addto', delegate);
    },

    // move element to right side of previous.
    _moveToPrev: function(elem) {
      var prev = $(elem).prev();
      var move = {
        elem: elem,
        prev: prev,
        left: prev.exists() ? $(prev).boundary().right : 0,
        call: function() {
          $(this.elem).css({ left: this.left });
        }
      };

      this.trigger('sliderview:moveto', move);
    },

    // move element to left or right side of the element.
    _moveTo: function(elem, left) {
      var move = {
        elem: elem,
        left: left ? $(elem).boundary().left : $(elem).boundary().right,
        call: function() {
          $(this.elem).css({ left: this.left });
        }
      };

      this.trigger('sliderview:moveto', move);
    },

    // insert slide with the model, after insert, rest element should be
    // moved to right side.
    insert: function(model) {
      var index = this.datasource.indexOf(model);
      var slide = this._slide(index);
      var prev = this.datasource.at(index - 1);

      this._insertAfter(prev && this.getByCid(prev.cid), slide);

      _.each(slide.nextAll(), function(elem) {
        this._moveTo(elem, false);
      }, this);

      return this;
    },

    // slide insert to front of slides.
    unshift: function() {
      var elem = _.first(this.$el.children());
      var model = this.getModelByElement(elem);
      if (model !== undefined) {
        var index = this.datasource.indexOf(model);
        index !== 0 && this._insertBefore(elem, this._slide(index - 1));
      }

      return this;
    },

    // add new slide after last slide in slider.
    push: function() {
      var model = this.getModelByElement( this.$el.children().last() );
      var index = this.datasource.indexOf(model);
      model = this.datasource.at(index + 1);
      if (model !== undefined) {
        this.insert(model);
      } else {
        this.trigger('sliderview:endofdata');
      }
      return this;
    },

    // update by model's contents.
    update: function(model) {
      var elem = this.getByCid(model.cid);
      elem !== undefined && $(elem).empty().append( model.get('contents') );
    },

    // make slide to left.
    slideLeft: function() {
      var childrens = this.$el.children();
      _.each(childrens, function(elem) { this._moveTo(elem, true); }, this);
      return this;
    },

    // make slide to right.
    slideRight: function() {
      var childrens = this.$el.children().get().reverse();
      _.each(childrens, function(elem) { this._moveTo(elem, false); }, this);
      return this;
    },

    // remove by the model. rest element should be moved to left side.
    remove: function(model) {
      if (model === undefined) return;
      var elem = this.getByCid(model.cid);

      if (elem) {
        var deferred = $.Deferred();
        deferred.context = this;
        deferred.rest = $(elem).nextAll();
        deferred.done(function() {
          _.each(this.rest, function(elem) {
            this._moveToPrev(elem);
          }, this.context);
        });

        var delegate = {
          elem: elem,
          call: function() {
            this.elem && $(this.elem).remove();
            this.after.resolve();
          },
          after: deferred
        };

        this.trigger('sliderview:remove', delegate);
      }

      return this;
    },

    // remove front slide of slider.
    shift: function() {
      this.remove( this.getModelByElement(this.$el.children()[0]) );
      return this;
    },

    // remove end slide of slider.
    pop: function() {
      this.remove( this.getModelByElement(this.$el.children().last()) );
      return this;
    },

    // set slider position to center.
    afterRender: function() {
      var $parent = this.$el.parent();
      this.$el.css({
        top: Math.floor( ($parent.height() - this.options.height) / 2),
        left: Math.floor( ($parent.width() - this.options.width) / 2 )
      });
    }
  });

  // examples view, it's from image slider of cooliris app.
  var Cooliris = Backbone.TV.View.extend({
    className: 'cooliris',

    maxImageCount: 100,

    maxViewportCount: 5,

    imageDeferreds: {},

    // bind events, create datasource and slider.
    initialize: function() {
      // binding keyevents and view events.
      this.on('keydown:option', this.removeRandomSlide, this);
      this.on('keydown:left', this.slideLeft, this);
      this.on('keydown:right', this.slideRight, this);
      this.on('render:after', this.afterRender, this);


      // save downloaded images, this collection is going to bind
      // slider crud methods. like as insert and remove.
      this.datasource = new Backbone.Collection();

      // sliderview show and slide downloaded images.
      var sliderOptions = {
        className: 'slider',
        width: 240 * this.maxViewportCount,
        height: 240,
        collection: this.datasource
      };

      this.slider = new SliderView(sliderOptions);

      this.slider.on('sliderview:moveto', function(delegate) {
        delegate.call();
      });

      this.slider.on('sliderview:addto', function(delegate) {
        delegate.call();
      }, this);

      this.slider.on('sliderview:remove', function(delegate) {
        delegate.call();
      }, this);

    },

    // remove slide with random number.
    removeRandomSlide: function() {
      var model = this.datasource.at( _.random(0, this.datasource.length - 1) );
      this.datasource.remove(model);
      this.slider.length() < this.maxViewportCount && this.slider.push();
    },

    // download other image via resource manager.
    downloadImage: function(index, callback, context) {
      var image = Images[ _.random(0, Images.length - 1) ];
      this.imageDeferreds[image.uri] = R.load([ image ], this);
      this.imageDeferreds[image.uri].done(function() {
        callback.call(context, index, image);
        delete this.imageDeferreds[image.uri];
      });
    },

    // return default image.
    defaultImage: function() {
      return $('<img class="photo" />').css({width:240, height:240})[0]
    },

    // firstly, add default image to datasouce and request image to resource
    // manager. if image was download, update slide with the contents (image).
    fillup: function() {
      if (this.datasource.length < this.maxImageCount) {
        this.datasource.add({ contents: this.defaultImage() }, { merge: true });

        var updateImage = function(index, image) {
          var $img = $(R.get(image)).clone(true).css({width:240, height:240});
          var model = this.datasource.at(index);
          model && model.set({ contents: $img[0] })
        };

        this.downloadImage(this.datasource.length - 1, updateImage, this);
      } else {
        console.warn('cound of downloaded images is over.');
      }
    },

    slideLeft: function(view, keyevent) {
      // make slide to left if slider length will over the max count.
      if (this.slider.length() >= this.maxViewportCount) {
        this.slider.slideLeft().shift();
      }

      // make slide fill up if slider length is under the max count.
      if (this.slider.length() < this.maxViewportCount) {
        this.fillup();
      }
    },

    slideRight: function(view, keyevent) {
      // make slide to right if more previous slide is exist.
      if (this.slider.front().index > 0) {
        this.slider.unshift().slideRight();
      }

      // make slide to pop if slider length overed the max count.
      if (this.slider.length() > this.maxViewportCount) {
        this.slider.pop();
      }
    },

    render: function() {
      this.append(this.slider);
      return this;
    },

    afterRender: function() {
      // fill up first image to slider.
      _.times(1, function() { this.fillup(); }, this);

      // take focus to this view.
      this.focusin();
    }
  });

  return Cooliris;

});
