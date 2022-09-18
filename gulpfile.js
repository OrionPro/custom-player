'use strict';

const babel = require('gulp-babel'),
  browserSync = require('browser-sync'),
  cleanCSS = require('gulp-clean-css'),
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  prefixer = require('gulp-autoprefixer'),
  rigger = require('gulp-rigger'),
  rimraf = require('rimraf'),
  sass = require('gulp-sass')(require('node-sass')),
  sourcemaps = require('gulp-sourcemaps'),
  strip = require('gulp-strip-comments'),
  uglify = require('gulp-uglify'),
  watch = require('gulp-watch'),
  prettier = require('gulp-prettier');

function swallowError(error) {
  // If you want details of the error in the console
  console.log(error.toString());
  this.emit('end');
}

const folders = {
  src: 'src/',
  dst: './',
};

const path = {
  build: {
    html: folders.dst,
    js: folders.dst + 'dist/js/',
    css: folders.dst + 'dist/css/',
    images: folders.dst + 'dist/images/',
    fonts: folders.dst + 'dist/fonts/',
  },
  src: {
    html: folders.src + 'html/templates/*.html',
    js: folders.src + 'js/*.js',
    css: folders.src + 'styles/app.scss',
    images: folders.dst + 'images/**/*.*',
    fonts: [
      'node_modules/font-awesome-sass/assets/fonts/**/*.woff',
      'node_modules/font-awesome-sass/assets/fonts/**/*.woff2',
    ],
  },
  watch: {
    html: folders.src + 'html/**/*.html',
    js: folders.src + 'js/**/*.js',
    css: folders.src + 'styles/**/**/*.scss',
  },
  clean: ['js', 'css'],
  node: 'node_modules',
};

gulp.task('js:build', function () {
  return gulp
    .src(path.src.js)
    .pipe(
      babel({
        presets: ['@babel/preset-env'],
      })
    )
    .on('error', swallowError)
    .pipe(rigger())
    .pipe(strip())
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest(path.build.js))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task('js:prettier', function () {
  return gulp
    .src('./src/js/**/*.*')
    .pipe(prettier({ singleQuote: true }))
    .pipe(gulp.dest('./src/js'));
});

gulp.task('styles:build', function () {
  return gulp
    .src(path.src.css)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: [path.src.css],
        outputStyle: 'compressed',
        sourceMap: true,
        errLogToConsole: true,
      })
    )
    .on('error', swallowError)
    .pipe(prefixer())
    .pipe(cleanCSS({ level: { 1: { specialComments: 0 } } }))
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest(path.build.css))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task('styles:prettier', function () {
  return gulp
    .src('./src/styles/**/*.*')
    .pipe(prettier({ singleQuote: true }))
    .pipe(gulp.dest('./src/styles'));
});

gulp.task('images:build', function () {
  return gulp
    .src(path.src.images)
    .pipe(
      image({
        pngquant: true,
        optipng: false,
        zopflipng: true,
        jpegRecompress: false,
        mozjpeg: true,
        guetzli: false,
        gifsicle: true,
        svgo: true,
        concurrent: 10,
      })
    )
    .pipe(gulp.dest(path.build.images));
});

gulp.task('fonts:build', function () {
  return gulp.src(path.src.fonts).pipe(gulp.dest(path.build.fonts));
});

gulp.task('html:build', function () {
  return gulp
    .src(path.src.html)
    .pipe(rigger())
    .pipe(gulp.dest(path.build.html))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task('clean', function (cb) {
  for (var i = 0; i < path.clean.length; i++) {
    rimraf(path.clean[i], cb);
  }
});

gulp.task(
  'build',
  gulp.parallel('fonts:build', 'js:build', 'html:build', 'styles:build')
);

gulp.task('prettier', gulp.parallel('styles:prettier', 'js:prettier'));

const watchTask = function () {
  watch(path.watch.css, gulp.series('styles:build'), function () {
    browserSync.reload();
  }),
    watch(path.watch.js, gulp.series('js:build'), function () {
      browserSync.reload();
    }),
    watch(path.watch.html, gulp.series('html:build'), function () {
      browserSync.reload();
    });
};

gulp.task(
  'default',
  gulp.series(gulp.series('build'), function () {
    const files = [folders.dst + '*.*'];
    browserSync.init(files, {
      server: {
        baseDir: './',
      },
    });
    watchTask();
  })
);
