const {src, dest, series, parallel, watch} = require('gulp')
const sass = require('gulp-sass')
const del = require('del')
const imagemin = require('imagemin')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const babelify = require('babelify')
const browsersync = require('browser-sync')
const postcss = require('gulp-postcss')
const cssnext = require('postcss-cssnext')
const importer = require('node-sass-package-importer')

const path = {
  src: './src/',
  build: './build/'
}

const clean = () => {
  return del(['build'])
}

const html = () => {
  return src(path.src + '*.html')
    .pipe(dest(path.build))
}

const style = () => {
  const borwser = [
    cssnext({
      browsers: 'last 2 version'
    })
  ]
  return src(path.src + 'assets/styles/**/*.sass')
    .pipe(sass({
      importer: importer({
        extensions: ['.sass', '.css']
      }),
      outputStyle: 'compressed'
    }))
    .pipe(postcss(borwser))
    .pipe(dest(path.build + 'assets/styles/'))
}

const script = () => {
  return browserify(path.src + 'assets/scripts/main.js')
    .transform(babelify, {presets: ['@babel/preset-env']})
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(dest(path.build + 'assets/scripts/'))
}

const image = () => {
  return imagemin([path.src + 'assets/images/*'], path.build + 'assets/images/')
}

const sync = () => {
  browsersync({
    server: {
      baseDir: './build/'
    }
  })
}

const reload = (done) => {
  browsersync.reload()
  done()
}

const watcher = () => {
  watch(path.src + '*.html', series(html, reload))
  watch(path.src + 'assets/scripts/*.js', series(script, reload))
  watch(path.src + 'assets/styles/*.sass', series(style, reload))
  watch(path.src + 'assets/images/*', series(image, reload))
}

exports.default = series(
  clean,
  parallel(
    html,
    style,
    script,
    image
  ),
  parallel(sync, watcher)
)

exports.build = series(
  clean,
  parallel(
    html,
    style,
    script,
    image
  )
)