/*global module:false*/
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
    return connect['static'](require('path').resolve(dir));
};
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    jshint: {
      options: {
        jshintrc: true
      },
      all: ['src/js/**/*.js']
    },

    connect: {
      options: {
        port:9000

      },
      server: {
        options: {
          port:9000,
          // change this to '0.0.0.0' to access the server from outside
          hostname: 'localhost'
        }
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, './src/')
            ];
          }
        }
      }
    },

    //Open default browser at the app
    open: {
      server: {
        path: 'http://localhost:<%= connect.options.port %>'
      }
    },
    //setup watch tasks
    watch: {
      options: {
        nospan: true,
        livereload: LIVERELOAD_PORT
      },

      source: {
        files: ['./src/js/**/*.js'],
        tasks: ['jshint']
      },
      livereload:{
        options: {
          livereload:LIVERELOAD_PORT
        },
        files:[
          './src/js/**/*.js',
          './src/**/*.html',
          './src/css/**/*.css'
        ]
      }
    },
    // clean the output directory before each build
    clean: {
      build: ['dist'],
      deploy: ['dist/**/*.consoleStripped.js','dist/**/*.uncompressed.js','dist/**/*.js.map']
    },
    copy: {
      build: {
        expand: true,
        cwd: 'src/',
        src: '**',
        dest: './dist/'
      }
    },
    'gh-pages': {
      options: {
        base: 'dist'
      },
      src: ['**']
    }
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['serve']);

  grunt.registerTask('serve', function (target) {
    grunt.task.run([
      'jshint',
      'connect:livereload',
      'open',
      'watch'
    ]);
  });

  grunt.registerTask('hint', ['jshint']);

  grunt.registerTask('build', ['jshint', 'clean:build', 'copy:build']);

  grunt.registerTask('deploy', ['clean:deploy', 'build', 'gh-pages']);
};
