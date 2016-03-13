/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at
http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at
http://polymer.github.io/PATENTS.txt
*/

'use strict';

// Include Gulp & tools we'll use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var $tasks = require('require-dir')('tasks', { camelcase: true });
var del = require('del');
var runSequence = require('run-sequence');
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var packageJson = require('./package.json');
var crypto = require('crypto');

var API_PORT = 8080;

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);

/**
 * Watch files for changes & reload.
 */
gulp.task('serve', ['jshint', 'jscs', 'babel'], function () {
  $tasks.serve(5000, API_PORT, ['.tmp', 'app']);

  var reload = $tasks.serve.reload;
  gulp.watch(['app/**/*.html', '!app/bower_components/**/*.html'],
             ['jshint', 'babel', reload]);
  gulp.watch(['app/{scripts,elements}/**/{*.js,*.html}'],
             ['jshint', 'jscs', 'babel', reload]);
  gulp.watch(['app/{styles,elements}/**/*.css'], reload);
  gulp.watch(['app/images/**/*'], reload);
});

/**
 * Serve production build.
 */
gulp.task('serve:dist', ['default'], function () {
  $tasks.serve(5001, API_PORT, 'dist');
});

/**
 * Push build output to dist branch so git submodule can pick it up.
 */
gulp.task('deploy', ['default'], function () {
  return gulp.src('dist/**/*')
    .pipe($.ghPages({ branch: 'dist' }));
});

/**
 * Build production files, the default task.
 */
gulp.task('default', ['clean'], function (cb) {
  runSequence(
    ['jshint', 'jscs', 'copy'],
    ['styles', 'images', 'fonts', 'babel'],
    'html',
    'vulcanize',
    'prune',
    'cache-config',
    cb);
});

/**
 * Lint JavaScript.
 */
gulp.task('jshint', function () {
  return gulp.src([
    'app/scripts/**/*.js',
    'app/elements/**/*.js',
    'app/elements/**/*.html',
    'gulpfile.js',
  ])
    .pipe($.jshint.extract('auto')) // Extract JS from .html files
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

/**
 * Enforce JavaScript code style.
 */
gulp.task('jscs', function () {
  return gulp.src([
    'app/scripts/**/*.js',
    'app/elements/**/*.js',
    'gulpfile.js',
  ])
    .pipe($.jscs())
    .pipe($.jscs.reporter());
});

/**
 * Copy root level files.
 */
gulp.task('copy', function () {
  var app = gulp.src([
    'app/*',
    '!app/test',
    '!app/cache-config.json',
    '!**/.DS_Store',
  ], {
    dot: true,
    nodir: true,
  })
    .pipe(gulp.dest('dist'));

  var bower = gulp.src([
    'app/bower_components/**/*',

    // Don't copy polyfills, useref will pick them up
    '!app/bower_components/{webcomponentsjs,es5-shim,' +
                           'es6-promise-polyfill}/**/*',
    '!**/.DS_Store',
  ], {
    nodir: true,
  })
    .pipe(gulp.dest('dist/bower_components'));

  var elements = gulp.src([
    'app/elements/**/*',
    '!**/.DS_Store',
  ])
    .pipe(gulp.dest('dist/elements'));

  return merge(app, bower, elements)
    .pipe($.size({ title: 'copy' }));
});

/**
 * Minify stylesheets.
 */
gulp.task('styles', function () {
  return gulp.src('app/styles/**/*.css')
    .pipe($.cssmin())
    .pipe(gulp.dest('dist/styles'))
    .pipe($.size({ title: 'styles' }));
});

/**
 * Optimize images.
 */
gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({ title: 'images' }));
});

/**
 * Copy web fonts to dist.
 */
gulp.task('fonts', function () {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({ title: 'fonts' }));
});

/**
 * Transpile all JS to ES5.
 */
gulp.task('babel', function () {
  return gulp.src([
    'app/**/*.{js,html}',
    '!app/bower_components/**',
    '!app/test/**',
  ])
    .pipe($.changed('.tmp', { extension: '.js' }))
    .pipe($.sourcemaps.init())
      // Extract JS from .html files
      .pipe($.if('*.html', $.crisper({ scriptInHead: false })))
      .pipe($.if('*.js', $.babel({
        presets: ['es2015'],
      })))
      .on('error', function (err) {
        console.log($.util.colors.red('[Babel Error]'));
        if (err.showStack) {
          console.log(err.stack);
        } else {
          console.log(err.name + ': ' + err.message + '\n' + err.codeFrame);
        }

        this.emit('end');
      })
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp'))
    .pipe($.if('*.js', $.uglify()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({ title: 'babel' }));
});

/**
 * Minify HTML and concatinate blocks.
 */
gulp.task('html', function () {
  return gulp.src('dist/*.html')
    .pipe($.useref({ searchPath: ['dist', 'app'] }))
    .pipe($.if('*.html', $tasks.htmlmin()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({ title: 'html' }));
});

/**
 * Concatenate imports into one file.
 */
gulp.task('vulcanize', function () {
  return gulp.src('dist/elements/elements.html')
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true,
    }))

    // Extract inline JS
    .pipe($.crisper())

    // Then minify both files
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.html', $tasks.htmlmin()))

    .pipe(gulp.dest('dist/elements'))
    .pipe($.size({ title: 'vulcanize' }));
});

/**
 * Remove extra dist contents after vulcanize.
 */
gulp.task('prune', function (cb) {
  del([
    'dist/{bower_components,elements}/**/*',
    '!dist/elements/elements.{html,js}',

    // Keep SW stuff
    '!dist/bower_components/{platinum-sw,sw-toolbox,promise-polyfill}/**',
  ], cb);
});

/**
 * Generate config data for the <sw-precache-cache> element.
 *
 * This includes a list of files that should be precached, as well as a
 * (hopefully unique) cache id that ensure that multiple PSK projects don't
 * share the same Cache Storage.  This task does not run by default, but if you
 * are interested in using service worker caching in your project, please enable
 * it within the 'default' task.  See
 * https://github.com/PolymerElements/polymer-starter-kit#enable-service-
 * worker-support
 * for more context.
 */
gulp.task('cache-config', function (callback) {
  var dir = 'dist';
  var config = {
    cacheId: packageJson.name || path.basename(__dirname),
    disabled: false,
  };

  glob('{elements,scripts,styles}/**/*.*', { cwd: dir }, configureCache);

  function configureCache(error, files) {
    if (error) {
      callback(error);
    } else {
      files.push('index.html', './');
      config.precache = files;

      var md5 = crypto.createHash('md5');
      md5.update(JSON.stringify(config.precache));
      config.precacheFingerprint = md5.digest('hex');

      var configPath = path.join(dir, 'cache-config.json');
      fs.writeFile(configPath, JSON.stringify(config), callback);
    }
  }
});

/**
 * Clean output directories.
 */
gulp.task('clean', function (cb) {
  del(['.tmp', 'dist'], cb);
});
