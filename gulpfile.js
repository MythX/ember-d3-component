var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    watch = require('gulp-watch'),
    handlebars = require('gulp-ember-handlebars'),
    header = require('gulp-header'),
    runSequence = require('run-sequence'),
    pkg = require('./package.json');

var banner = [
'// ==========================================================================',
'// Project:   Ember D3 Component',
'// Copyright: © 2014 Antoine Moser',
'// License:   MIT (see LICENSE)',
'// ==========================================================================\n',
].join('\n');

var paths = {
  dist: 'dist/',
  templates: 'lib/templates/**/*.hbs',
  scripts: [
    'lib/templates-top.js',
    'lib/components/*.js'
  ],
  styles: 'lib/styles/ember-d3.less'
};

gulp.task('templates', function() {
  gulp.src([paths.templates])
    .pipe(handlebars({
      outputType: 'browser',
      processName: function(path) {
        return ('components/'+path).replace('.hbs', '');
      }
    }))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('tmp'));
});

gulp.task('scripts', function() {
  gulp.src(paths.scripts)
    .pipe(concat('components.js'))
    .pipe(gulp.dest('tmp'));
});

gulp.task('release', function() {
  gulp.src([
      'tmp/components.js',
      'tmp/templates.js'
    ])
    .pipe(concat('ember-d3.js'))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('styles', function() {
  return gulp.src(paths.styles)
    .pipe(less())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('default', function(callback) {
  runSequence('templates', 'scripts', 'release', 'styles', callback);
});