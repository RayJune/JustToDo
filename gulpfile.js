var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');


gulp.task('uglify', function () {
   gulp.src('scripts/src/bundle.js') 
    .pipe(sourcemaps.init())
      .pipe(uglify()) // now gulp-uglify works 
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest('scripts/dist/'));
});

gulp.task('default', ['uglify']);

