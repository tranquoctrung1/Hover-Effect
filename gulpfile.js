const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
const uglify = require('gulp-uglify-es').default;
const pug = require('gulp-pug');

const DIST = './.dist';

function reload(done) {
    browserSync.reload();
    done();
}

function browser_sync() {
    return browserSync.init({ server: { baseDir: DIST } });
}

function create_js() {
    return gulp.src('./src/js/**/*.js')
        .pipe(plumber())
        .pipe(uglify())
        .pipe(concat('main.js'))
        .pipe(gulp.dest(`${DIST}/js`));
}

function create_html() {
    return gulp.src(['./src/templates/**/*.pug', '!./src/templates/**/_*/**', '!./src/templates/**/_*.pug'])
        .pipe(plumber())
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest(DIST));
}

function create_css() {
    return gulp.src('./src/sass/main.sass')
        .pipe(plumber())
        .pipe(sass({ style: 'compressed' }).on('error', sass.logError))
        .pipe(concat('main.css'))
        .pipe(gulp.dest(`${DIST}/css`))
        .pipe(browserSync.stream());
}

// Only the libraries the page actually uses:
// Bootstrap (grid, reboot, typography, .text-center) + Font Awesome solid icons.
function noi_file_css() {
    return gulp.src([
        'node_modules/bootstrap/dist/css/bootstrap.min.css',
        'node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css',
        'node_modules/@fortawesome/fontawesome-free/css/solid.min.css',
    ])
        .pipe(concat('thuvien.css'))
        .pipe(gulp.dest(`${DIST}/css`));
}

// Binary assets: encoding:false keeps files byte-exact.
const copy = (src, dest) => () =>
    gulp.src(src, { encoding: false }).pipe(gulp.dest(`${DIST}/${dest}`));

const copy_img = copy('./src/img/*.*', 'img');
const copy_webfonts = copy('./src/webfonts/fa-solid-900.*', 'webfonts');
const copy_favicon = copy('./src/favicon/*.*', 'favicon');

function watch() {
    gulp.watch('./src/js/**/*.js', gulp.series(create_js, reload));
    gulp.watch('./src/sass/**/*.sass', create_css); // injected via browserSync.stream
    gulp.watch('./src/templates/**/*.pug', gulp.series(create_html, reload));
    gulp.watch('./src/img/*.*', gulp.series(copy_img, reload));
}

const build = gulp.parallel(
    create_html,
    create_js,
    create_css,
    noi_file_css,
    copy_img,
    copy_webfonts,
    copy_favicon
);

exports.build = build;
exports.default = gulp.series(build, gulp.parallel(browser_sync, watch));
