var gulp        = require('gulp'),
    jshint      = require('gulp-jshint'),
    concat      = require('gulp-concat'),
    less        = require('gulp-less'),
    watch       = require('gulp-watch'),
    livereload  = require('gulp-livereload'),
    handlebars  = require('gulp-ember-handlebars'),
    header      = require('gulp-header'),
    runSequence = require('run-sequence'),
    pkg         = require('./package.json');

var banner = [
'// ==========================================================================',
'// Project:   Ember D3 Component',
'// Version    v<%= pkg.version %>',
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
  styles: 'lib/styles/ember-d3.less',
  css: 'dist/*.css'
};

gulp.task('templates', function() {
  gulp.src([paths.templates])
    .pipe(handlebars({
      outputType: 'browser',
      namespace: 'Ember.TEMPLATES'
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

gulp.task('watch', function() {
  var server = livereload();
  var changed = function(file) {
    server.changed(file.path);
  };

  gulp.watch(paths.scripts, ['scripts', 'release']).on('change', changed);
  gulp.watch(paths.templates, ['templates']).on('change', changed);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.css).on('change', changed);
});

gulp.task('default', function(callback) {
  runSequence('templates', 'scripts', 'release', 'styles', callback);
});