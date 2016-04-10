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
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const $tasks = require('require-dir')('tasks', { camelcase: true });
const browserSync = require('browser-sync');
const os = require('os');
const del = require('del');
const runSequence = require('run-sequence');
const merge = require('merge-stream');
const path = require('path');
const fs = require('fs-promise');
const globby = require('globby');
const packageJson = require('./package.json');
const crypto = require('crypto');

// Define other constants
const WINDOWS = /^win/.test(os.platform());
const MAC = /^darwin$/.test(os.platform());

const API_PORT = 8080;

const AUTOPREFIXER_BROWSERS = [
  '> 1%',
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10',
];

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);

/**
 * Watch files for changes & reload.
 */
gulp.task('serve', ['jshint', 'jscs', 'babel', 'styles'], () => {
  browserSync.init($tasks.getServerConfig(5000, API_PORT, ['.tmp', 'app'], {
    '/bower_components': 'bower_components',
  }));

  gulp.watch('app/**/*.html', ['jshint', 'babel', browserSync.reload]);
  gulp.watch(['app/{scripts,elements}/**/*.js', 'app/*.js'],
             ['jshint', 'jscs', 'babel', browserSync.reload]);
  gulp.watch('app/styles/**/*.css', ['styles', browserSync.reload]);
  gulp.watch(['app/elements/**/*', '!app/elements/**/*.{html,js}'],
             browserSync.reload);
  gulp.watch('app/images/**/*', browserSync.reload);
});

/**
 * Serve production build.
 */
gulp.task('serve:dist', ['default'], () => {
  let testingBrowsers = [
    'firefox',
    'google chrome',
    'opera',
  ];

  if (WINDOWS) {
    testingBrowsers.push('iexplore');
  } else if (MAC) {
    testingBrowsers.push('safari');
  }

  browserSync.init($tasks.getServerConfig(5001, API_PORT, 'dist', {},
                                          testingBrowsers));
});

/**
 * Push build output to dist branch so git submodule can pick it up.
 */
gulp.task('deploy', ['default'], () =>
  gulp.src('dist/**/*')
    .pipe($.ghPages({ branch: 'dist' }))
);

/**
 * Build production files, the default task.
 */
gulp.task('default', ['clean'], callback => {
  runSequence(
    ['jshint', 'jscs', 'copy'],
    ['styles', 'images', 'fonts', 'babel'],
    'html',
    'vulcanize',
    'prune',
    'cache-config',
    callback
  );
});

/**
 * Lint JavaScript.
 */
gulp.task('jshint', () =>
  gulp.src([
    'app/**/*.{js,html}',
    'gulpfile.js',
  ])
    .pipe($.jshint.extract('auto')) // Extract JS from .html files
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
);

/**
 * Enforce JavaScript code style.
 */
gulp.task('jscs', () =>
  gulp.src([
    'app/**/*.js',
    'gulpfile.js',
  ])
    .pipe($.jscs())
    .pipe($.jscs.reporter('jscs-stylish'))
);

/**
 * Copy root level files.
 */
gulp.task('copy', () => {
  let app = gulp.src([
    'app/*',
    '!app/test',
    '!app/cache-config.json',
    '!**/.DS_Store',
  ], {
    dot: true,
    nodir: true,
  })
    .pipe(gulp.dest('dist'));

  let bower = gulp.src([
    'bower_components/**/*',
    '!**/.DS_Store',
  ], {
    nodir: true,
  })
    .pipe(gulp.dest('dist/bower_components'));

  let elements = gulp.src([
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
gulp.task('styles', () =>
  gulp.src('app/styles/**/*.css')
    .pipe($.changed('.tmp/styles', { extension: '.css' }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.cssmin())
    .pipe(gulp.dest('dist/styles'))
    .pipe($.size({ title: 'styles' }))
);

/**
 * Optimize images.
 */
gulp.task('images', () =>
  gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({ title: 'images' }))
);

/**
 * Copy web fonts to dist.
 */
gulp.task('fonts', () =>
  gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({ title: 'fonts' }))
);

/**
 * Transpile all JS to ES5.
 */
gulp.task('babel', () =>
  gulp.src([
    'app/**/*.{js,html}',
    '!app/test/**/*',
  ])
    .pipe($.changed('.tmp', { extension: '.js' }))
    .pipe($.sourcemaps.init())
      // Extract JS from .html files
      .pipe($.if('*.html', $.crisper({ scriptInHead: false })))
      .pipe($.if('*.js', $.babel({
        plugins: [
          'iife-wrap',
          'transform-es2015-template-literals',
          'transform-es2015-literals',
          'transform-es2015-function-name',
          'transform-es2015-arrow-functions',
          'transform-es2015-block-scoped-functions',
          'transform-es2015-classes',
          'transform-es2015-object-super',
          'transform-es2015-shorthand-properties',
          'transform-es2015-duplicate-keys',
          'transform-es2015-computed-properties',
          'transform-es2015-for-of',
          'transform-es2015-sticky-regex',
          'transform-es2015-unicode-regex',
          'check-es2015-constants',
          'transform-es2015-spread',
          'transform-es2015-parameters',
          'transform-es2015-destructuring',
          'transform-es2015-block-scoping',
          ['transform-regenerator', { async: false, asyncGenerators: false }],
        ],
      })))
      .on('error', function (err) {
        console.log($.util.colors.red('[Babel Error]'));
        if (err.showStack) {
          console.log(err.stack);
        } else {
          console.log(`${err.name}: ${err.message}\n${err.codeFrame}`);
        }

        this.emit('end');
      })
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp'))
    .pipe($.if('*.js', $.uglify()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({ title: 'babel' }))
);

/**
 * Minify HTML and concatinate blocks.
 */
gulp.task('html', () =>
  gulp.src('dist/*.html')
    .pipe($.useref({ searchPath: 'dist' }))
    .pipe($.if('*.html', $tasks.htmlmin()))
    .pipe($.if('*.js', $.uglify()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({ title: 'html' }))
);

/**
 * Concatenate imports into one file.
 */
gulp.task('vulcanize', () =>
  gulp.src('dist/elements/elements.html')
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
    .pipe($.size({ title: 'vulcanize' }))
);

/**
 * Remove extra dist contents after vulcanize.
 */
gulp.task('prune', () =>
  del([
    'dist/{bower_components,elements}/**/*',
    '!dist/elements/elements.{html,js}',

    // Keep SW stuff
    '!dist/bower_components/{platinum-sw,sw-toolbox,promise-polyfill}/**',
  ])
);

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
gulp.task('cache-config', () => {
  const dir = 'dist';
  let config = {
    cacheId: packageJson.name || path.basename(__dirname),
    disabled: false,
  };

  return globby('{elements,scripts,styles}/**/*.*', { cwd: dir })
    .then(files => {
      files.push('index.html', './');
      config.precache = files;

      let md5 = crypto.createHash('md5');
      md5.update(JSON.stringify(config.precache));
      config.precacheFingerprint = md5.digest('hex');

      return fs.writeFile(path.join(dir, 'cache-config.json'),
                          JSON.stringify(config));
    });
});

/**
 * Clean output directories.
 */
gulp.task('clean', () => del(['.tmp', 'dist']));
