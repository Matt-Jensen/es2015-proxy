var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var rollup = require('gulp-rollup');
var babel = require('gulp-babel');
var rename = require('gulp-rename');
var util = require('gulp-util');
var jscs = require('gulp-jscs');
var watch = require('gulp-watch');
var plumber = require('gulp-plumber');
var print = require('gulp-print');
var uglify = require('gulp-uglify');
var tape = require('gulp-tape');
var tapColorize = require('tap-colorize');

gulp.task('watch', function() {
  watch('./src/*.js', compile);
  return compile();
});

gulp.task('lint', lint);

gulp.task('test', function() {
  return gulp.src('./tests/*.js')
  .pipe(tape({
    reporter: tapColorize()
  }));
});

gulp.task('default', ['watch'])

function compile() {
  gulp.src('./src/index.js')
  .pipe(print(function(filepath) {
    return 'built: ' + filepath
  }))
  .pipe(plumber({
    errorHandler: function(err) {
      console.log(err.message)
      this.emit('end')
    }
  }))
  .pipe(rollup({
    sourceMap: true
  }))
  .pipe(babel())
  .on('error', util.log)
  .pipe(rename('proxy-polyfill.js'))
  .pipe(gulp.dest('./dist'))
  .pipe(uglify())
  .pipe(rename('proxy-polyfill.min.js'))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('./dist'));

  gulp.src('./src/implementation.js')
  .pipe(print(function(filepath) {
    return 'built: ' + filepath
  }))
  .pipe(plumber({
    errorHandler: function(err) {
      console.log(err.message);
      this.emit('end');
    }
  }))
  .pipe(rollup({
    sourceMap: true
  }))
  .pipe(babel({
    plugins: ['transform-es2015-modules-commonjs']
  }))
  .on('error', util.log)
  .pipe(gulp.dest('./test-helpers'));
}

function lint() {
  return gulp.src(['./src/*.js', './tests/*.js'])
  .pipe(jscs({ fix: true, configPath: '.jscsrc' }))
  .pipe(jscs.reporter());
}
