var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
// var browserSync = require('browser-sync');

// gulp.task('browser-sync', function() {
//   browserSync({
//     server: {
//       baseDir: ''
//     }
//   })
// });

gulp.task('uglify', function () {
  gulp.src('scripts/src/bundle.js')
    .pipe(sourcemaps.init())
    .pipe(uglify()) // now gulp-uglify works 
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest('scripts/dist/'));
});

gulp.task('watch', function () {
  gulp.watch(['scripts/src/main.js'], ['uglify']);
});

gulp.task('default', ['uglify', 'watch']);

