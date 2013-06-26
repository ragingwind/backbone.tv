define([
  // Libraries.
  "jquery",
  "lodash",
  "backbone",
  "backbone_tv",
  "../../backbone.tv.widget"
],

function($, _, Backbone) {
  var app = {
    // application default window.
    window: undefined,

    // application path presets.
    paths: {
      template: 'examples/templates/',
      image: 'examples/images/'
    },
  };

  // create window view
  app.window = new Backbone.TV.Screen().render();

  // configuration for backbone.tv
  Backbone.TV.configure({
    // can be used to supply manipulation of path.
    path: function(type, path) {
      if (type === 'template') {
        path = app.paths.template + path;
      }
      else if (type === 'image') {
        if (/http:|https:/.test(path) == false) {
          path = app.paths.image + path;
        }
      }
      return path;
    }
  });

  return _.extend(app, {}, Backbone.Events);
});
