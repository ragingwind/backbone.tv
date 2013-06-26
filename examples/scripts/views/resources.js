define([
  'app'
],

function(app) {

  "use strict";

  var Resources = Backbone.TV.View.extend({
    className: 'resources',

    // sample images from pinterest.
    images: [
      {uri: 'image://http://media-cache-lt0.pinterest.com/upload/159596380516754443_jzTxwQlS_c.jpg' },
      {uri: 'image://http://media-cache0.pinterest.com/upload/282178732874379577_SPPr63uY_c.jpg' },
      {uri: 'image://http://media-cache-ec4.pinterest.com/upload/16818198580046845_KfqleauN_c.jpg' },
      {uri: 'image://http://media-cache-ec2.pinterest.com/upload/282178732874372119_9Rx3E5hX_c.jpg' },
      {uri: 'image://http://media-cache-ec5.pinterest.com/upload/244320348506604316_w0DfcIND_c.jpg' },
      {uri: 'image://http://media-cache-ec2.pinterest.com/upload/13933080069065202_nSrpDvkI_c.jpg' },
      {uri: 'image://http://media-cache-ec6.pinterest.com/upload/32510428529915840_F3oydjjM_c.jpg' },
      {uri: 'image://http://media-cache-lt0.pinterest.com/upload/174936766746921483_LZrnKJlS_c.jpg' }
    ],

    initialize: function() {
      this.on('keyup:*', this.keydown, this);
      this.on('render:after', this.afterRender, this);
    },

    render: function() {
      this.$el.html('<ul><li></li><li></li><li></li><li></li></ul>');
      return this;
    },

    afterRender: function() {
      var indexes = _.times(4, _.partial(_.random, 0, this.images.length - 1));
      var requestImages = {};
      var time = new Date();

      // append random number to uri to make grant unique number.
      _.each(indexes, function(i) {
        var id = i + _.random(0, time.getMilliseconds());
        requestImages[id] = this.images[i];
      }, this);

      this.resourceDeferred = R.load(requestImages, this);
      this.resourceDeferred.done(function() {
        var li = this.$el.find('li');
        var i = 0;
        _.each(requestImages, function(image) {
          var img = R.get(image);
          $(li[i++]).append($(img).clone(true));
        }, this);

        delete this.resourceDeferred;
      });

      this.focusin();
    },

    keydown: function(v, e) {
      if (this.resourceDeferred !== undefined)
        this.resourceDeferred.reject();
      this.render();
    }
  });

  return Resources;

});
