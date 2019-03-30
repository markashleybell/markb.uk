const gulp = require('gulp');
const sass = require('gulp-sass');
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const filter = require('gulp-filter');
const plumber = require('gulp-plumber');

const scssFilter = filter('**/*.scss', { restore: true });

const tsProject = typescript.createProject('tsconfig.json');

const compileCss = () => 
    gulp.src(['./css/vendor/*.css', './css/*.scss'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(scssFilter)
        .pipe(sass())
        .pipe(scssFilter.restore)
        .pipe(cleanCSS())
        .pipe(concat('bundle.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'));

const compileJs = () => 
    gulp.src(['./js/*.ts'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(uglify())
        .pipe(concat('bundle.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'));

gulp.task('compile-css', compileCss);
gulp.task('compile-js', compileJs);

gulp.task('build', gulp.series('compile-css', 'compile-js'));

gulp.task('watch', done => {
    gulp.watch('./css/*.scss', gulp.series('compile-css'));
    gulp.watch('./js/*.ts', gulp.series('compile-js'));
    done();
});
