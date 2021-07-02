const { dest, series, src, task, watch } = require('gulp');
const sassCompiler = require('sass');
const sass = require('gulp-sass')(sassCompiler);
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

const tsProject = typescript.createProject('tsconfig.json');

function compileCss() {
    return src(['./css/*.scss'])
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(concat('bundle.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./public/css'));
}

function compileJs() {
    return src(['./js/*.ts'])
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(uglify())
        .pipe(concat('bundle.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./public/js'));
}

exports.build = series(compileCss, compileJs)

exports.watch = function() {
    watch('./css/*.scss', compileCss);
    watch('./js/*.ts', compileJs);
}
