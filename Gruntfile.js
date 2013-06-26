'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

/*global module:false*/
module.exports = function(grunt) {
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({

    connect: {
      options: {
          port: 9000,
          hostname: 'localhost'
      },
      server: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, './')
            ];
          }
        }
      }
    },

    open: {
      server: {
        path: 'http://localhost:<%= connect.options.port %>/examples'
      }
    },

    watch: {
      server: {
        files: [
          './*.js',
          'examples/styles/{,*/}*.css',
          'examples/scripts/{,*/}*.js',
          'examples/templates/{,*/}*.js',
          'examples/images/{,*/}*.{png,jpg,jpeg,webp}'
        ],
        tasks: ['livereload']
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        './*.js',
        'examples/{,*/}*.js',
        'test/spec/{,*/}*.js'
      ]
    }

  });

  grunt.renameTask('regarde', 'watch');

  grunt.registerTask('server', [
      'livereload-start',
      'connect:server',
      'open',
      'watch'
  ]);

  grunt.registerTask('test', [
  ]);

  grunt.registerTask('default', 'jshint');
};
