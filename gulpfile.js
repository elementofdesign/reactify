var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    ts = require('gulp-typescript'),
    typescript = require('typescript'),
    babel = require('gulp-babel');
var tsProject = ts.createProject('tsconfig.json', { typescript });

gulp.task('default', function () {
  return tsProject.src()
    // .pipe(sourcemaps.init())
    .pipe(tsProject()).js
    .pipe(
      babel({
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env'],
      })
    )
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});