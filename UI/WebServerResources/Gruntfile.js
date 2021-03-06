module.exports = function(grunt) {
  var js_files = {
    'js/Common.js': ['js/Common/*.app.js', 'js/Common/*.filter.js', 'js/Common/*Controller.js', 'js/Common/*.service.js', 'js/Common/*.directive.js', 'js/Common/utils.js'],
    'js/Main.js': ['js/Main/Main.app.js'],
    'js/Scheduler.services.js': ['js/Scheduler/*.service.js'],
    'js/Scheduler.js': ['js/Scheduler/Scheduler.app.js', 'js/Scheduler/*Controller.js', 'js/Scheduler/*.directive.js'],
    'js/Contacts.services.js': ['js/Contacts/*.service.js'],
    'js/Contacts.js': ['js/Contacts/Contacts.app.js', 'js/Contacts/*Controller.js', 'js/Contacts/*.directive.js'],
    'js/Mailer.services.js': ['js/Mailer/*.service.js', 'js/Mailer/*Controller.js', 'js/Mailer/*.directive.js'],
    'js/Mailer.js': ['js/Mailer/Mailer.app.js'],
    'js/Mailer.app.popup.js': ['js/Mailer/Mailer.popup.js'],
    'js/Preferences.services.js': ['js/Preferences/*.service.js'],
    'js/Preferences.js': ['js/Preferences/Preferences.app.js', 'js/Preferences/*Controller.js']
  };
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    sass: {
      options: {
        sourceMap: true,
        outFile: 'css/styles.css',
        noCache: true,
        includePaths: ['scss/',
                       'bower_components/breakpoint-sass/stylesheets/'
        ]
      },
      dist: {
        files: {
          'css/styles.css': 'scss/styles.scss'
        },
        options: {
          outputStyle: 'compressed'
        }
      },
      dev: {
        files: {
          'css/styles.css': 'scss/styles.scss'
        }
      }
    },
    postcss: {
      dist: {
        options: {
          map: false,
          processors: [
            require('autoprefixer-core')({browsers: '> 1%, last 2 versions, last 3 Firefox versions'}),
            // minifier
            require('csswring').postcss
          ]
          // We may consider using css grace (https://github.com/cssdream/cssgrace) for larger support
        },
        src: 'css/styles.css'
      },
      dev: {
        options: {
          map: true,
          processors: [
            require('autoprefixer-core')({browsers: '> 1%, last 2 versions, last 3 Firefox versions'})
          ]
          // We may consider using css grace (https://github.com/cssdream/cssgrace) for larger support
        },
        src: 'css/styles.css'
      }
    },
    jshint: {
      files: [].concat(Object.keys(js_files).map(function(v) { return js_files[v]; }))
    },
    uglify: {
      options: {
        sourceMap: true
      },
      dist: {
        files: js_files
      },
      dev: {
        options: {
          mangle: false,
          sourceMapIncludeSources: true
        },
        files: js_files
      }
    },
    watch: {
      grunt: {
        files: ['Gruntfile.js']
      },
      sass: {
        files: 'scss/**/*.scss',
        tasks: ['sass']
      },
      js: {
        files: Object.keys(js_files).map(function(key) { return js_files[key]; }),
        tasks: ['js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.task.registerTask('static', function() {
    var options = {
      'src': 'bower_components',
      'js_dest': 'js/vendor/',
      'fonts_dest': 'fonts/',
      'css_dest': 'css/'
    };
    grunt.log.subhead('Copying JavaScript files');
    var js = [
      '<%= src %>/angular/angular{,.min}.js{,.map}',
      '<%= src %>/angular-animate/angular-animate{,.min}.js{,.map}',
      '<%= src %>/angular-sanitize/angular-sanitize{,.min}.js{,.map}',
      '<%= src %>/angular-aria/angular-aria{,.min}.js{,.map}',
      '<%= src %>/angular-material/angular-material{,.min}.js{,.map}',
      '<%= src %>/angular-ui-router/release/angular-ui-router{,.min}.js',
      '<%= src %>/angular-file-upload/dist/angular-file-upload.min.js{,map}',
      //'<%= src %>/ng-file-upload/ng-file-upload{,.min}.js{,map}',
      '<%= src %>/lodash/lodash{,.min}.js'
    ];
    for (var j = 0; j < js.length; j++) {
      var files = grunt.file.expand(grunt.template.process(js[j], {data: options}));
      for (var i = 0; i < files.length; i++) {
        var src = files[i];
        var paths = src.split('/');
        var dest = options.js_dest + paths[paths.length - 1];
        grunt.file.copy(src, dest);
        grunt.log.ok("copy " + src + " => " + dest);
      }
    }
    /*
    grunt.log.subhead('Copying font files');
    var fonts = [
    ];
    for (var j = 0; j < fonts.length; j++) {
      var files = grunt.file.expand(grunt.template.process(fonts[j], {data: options}));
      for (var i = 0; i < files.length; i++) {
        var src = files[i];
        var paths = src.split('/');
        var dest = options.fonts_dest + paths[paths.length - 1];
        grunt.file.copy(src, dest);
        grunt.log.ok("copy " + src + " => " + dest);
      }
    }
    */
    /*
    grunt.log.subhead('Copying CSS files');
    var css = [
    ];
    for (var j = 0; j < css.length; j++) {
      var files = grunt.file.expand(grunt.template.process(css[j], {data: options}));
      for (var i = 0; i < files.length; i++) {
        var src = files[i];
        var paths = src.split('/');
        var dest = options.css_dest + paths[paths.length - 1];
        grunt.file.copy(src, dest);
        grunt.log.ok("copy " + src + " => " + dest);
      }
    }
    */
  });
  grunt.task.registerTask('build', ['static', 'uglify:dist', 'sass:dist', 'postcss:dist']);
  // Tasks for developers
  grunt.task.registerTask('default', ['watch']);
  grunt.task.registerTask('css', ['sass:dev', 'postcss:dev']);
  grunt.task.registerTask('js', ['jshint', 'uglify:dev']);
  grunt.task.registerTask('dev', ['css', 'js']);
};
