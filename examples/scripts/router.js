define([
  "app",
  "views/examples",
  "views/keycode",
  "views/homescreen",
  "views/thumbnail",
  "views/calculator",
  "views/mobilephone",
  "views/googletv",
  "views/resources",
  "views/cooliris",
  "views/animation",
],

function(
  app,
  examples,
  keycode,
  homescreen,
  thumbnail,
  calculator,
  mobilephone,
  googletv,
  resources,
  cooliris,
  animation
) {
  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      ":example": "examples",
      "": "root"
    },

    initialize: function() {
    },

    root: function() {
      app.window.rootView(new examples());
    },

    examples: function(example) {
      var obj = eval(example);
      if (obj) {
        var view = new obj;
        app.window.rootView(view);
      }
    }
  });

  return Router;

});
