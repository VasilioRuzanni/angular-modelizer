'use strict';

var gulp            = require('gulp'),
    lazypipe        = require('lazypipe'),
    jshintStylish   = require('jshint-stylish'),
    path            = require('path'),
    runSequence     = require('run-sequence'),
    gp              = require('gulp-load-plugins')(),
    gutil           = gp.util,
    log             = gp.util.log;


var paths = {

  // ## Source paths
  src: {
    js: ['src/**/*.js']
  },

  // ## Tests paths
  test: ['test/**/*.js'],

  // ## Production build dest paths
  build: {
    root: 'dist'
  }
};


// ==================================================
// Reusable pipelines
// ==================================================

// # Scripts / JS

var lintJs = lazypipe()
      .pipe(gp.plumber)
      .pipe(gp.jshint)
      .pipe(gp.jshint.reporter, jshintStylish);

var optimizeJs = lazypipe()
      .pipe(gp.uglify)
      .pipe(gp.rename, { suffix: '.min' })
      .pipe(gp.size, { showFiles: true });

// ==================================================
// DEVELOPMENT TASKS
// ==================================================

// # Main dev tasks

// Just watch right away by default
gulp.task('default', function (cb) {
  runSequence('watch', cb);
});


// # Dev watchdogs

gulp.task('watch', function () {
  // Who let the dogs out? Aww, aw aw, aw :)
  //
  // _|\___
  //    ( o ``--__
  //    ( o       O
  //    ___/\/\/\/
  // /--
  //

  gp.watch({ name: 'JavaScript watchdog', glob: paths.src.js, emitOnGlob: false }, ['js']);
});


// # Dev sub-tasks

// ## Scripts / JS

// Perform dev JS task: lint
gulp.task('js', function () {
  return gulp.src(paths.src.js)
    .pipe(lintJs());
});


// ==================================================
// PRODUCTION BUILD TASKS
// ==================================================

// Build production js and place everything into `./dist` folder
gulp.task('build', function () {
  return gulp.src(paths.src.js)
    .pipe(lintJs())
    .pipe(gulp.dest(paths.build.root))
    .pipe(optimizeJs())
    .pipe(gulp.dest(paths.build.root));
});


// ==================================================
// TEST TASKS
// ==================================================

gulp.task('test', function () {

});

gulp.task('test:unit', function () {

});

gulp.task('test:integration', function () {

});

gulp.task('test:e2e', function () {

});
