var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber')
var uglify = require('gulp-uglify-es').default;
var pug = require('gulp-pug');
sass.compiler = require('node-sass');

function reload(done) {
    browserSync.reload();
    done();
  }

function browser_sync ()
{
    return browserSync.init({
        server : {
            baseDir: "./.dist"
        }
    });
}


function create_js ()
{
    return gulp.src(['./src/js/**/*.js' ])
    .pipe(plumber())
    .pipe(uglify())
    .pipe(concat('main.js'))
    .pipe(gulp.dest("./.dist/js"));
}


function create_html () 
{
    return gulp.src(['./src/templates/**/*.pug','!./src/templates/{**/\_*,**/\_*/**}.pug'])
    .pipe(plumber())
    .pipe(pug({
        pretty: true
    }))
    .pipe(gulp.dest('./.dist'))
}


function create_css()
{
    return gulp.src(['./src/sass/**/*.sass','!./src/sass/{**/\_*,**/\_*/**}'])
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('./.dist/css'))
    .pipe(browserSync.stream());
}


function noi_file_css ()
{
    return gulp.src([
        'bower_components/bootstrap/dist/css/bootstrap.min.css',
        'bower_components/font-awesome/css/font-awesome.min.css',
        'node_modules/@fortawesome/fontawesome-free/css/all.css',
        'bower_components/animate.css/animate.min.css',
        'bower_components/jquery-lazy/jquery.lazy.min.js',
        // owl carousel
        'bower_components/owl.carousel/dist/assets/owl.carousel.min.css',
        'bower_components/owl.carousel/dist/assets/owl.theme.default.min.css',
    ])
    .pipe(concat('thuvien.css'))
    .pipe(gulp.dest('./.dist/css'));
}



function copy_img ()
{
    return gulp.src(['./src/img/*.*'])
    .pipe(gulp.dest('./.dist/img'));
}


function copy_fonts()
{
    return gulp.src('./src/fonts/*.*')
    .pipe(gulp.dest('./.dist/fonts'));
}


function copy_webfonts () {
    return gulp.src('./src/webfonts/*.*')
    .pipe(gulp.dest('./.dist/webfonts'));
  }


function copy_favicon ()
{
    return gulp.src('./src/favicon/*.*')
    .pipe(gulp.dest('./.dist/favicon'));
}


// function autoprefixer()
// {
//     return gulp.src([
//         './.dist/css/main.css',
//     ])
//     .pipe(autoprefixer({
//         browsers: [
//             'last 2 versions',
//             'iOS >= 7',
//             'Android >= 4',
//             'Explorer >= 10',
//             'ExplorerMobile >= 11'
//         ],
//         cascade: false
//     }))
//     .pipe(gulp.dest('./.dist/css'));
// }


function noi_file_js ()
{
    return gulp.src([
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/popper.js/dist/umd/popper.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',

        // owl carousel
        'bower_components/owl.carousel/dist/owl.carousel.min.js'
    ])
    .pipe(concat('thuvien.js'))
    .pipe(gulp.dest('./.dist/js'));
}


function watch()
{
    gulp.watch('./src/js/**/*.js',gulp.series(create_js,reload))
    gulp.watch('./src/sass/**/*.sass',gulp.series(create_css,reload))
    gulp.watch('./src/templates/**/*.pug',gulp.series(create_html,reload))
    gulp.watch('./src/img/*.*',gulp.series(copy_img,reload))
    // có thể comment 4 dòng trên cùng cũng dc
    gulp.watch('./src/**/*',gulp.series(reload))
}

//default task
exports.default = gulp.series(
    create_html,
    create_js,
    create_css,
    copy_img,
    noi_file_css,
    noi_file_js,
    copy_fonts,
    copy_favicon,
    copy_webfonts,
    // chạy song mới được
    gulp.parallel(browser_sync,watch)
)

