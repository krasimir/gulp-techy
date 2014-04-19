var gulp = require('gulp');
var techy = require('../index.js');

gulp.task('compile', function() {
	gulp.src('./src/**.*')
    .pipe(techy({
        src: './src/**.*'
    }))
    .pipe(gulp.dest('./dest'));
});

gulp.task('watchers', function() {
	gulp.watch(['src/**/*.*'], ['compile']);
});

gulp.task('default', ['compile', 'watchers']);