const {src, dest, series, parallel, watch} = require('gulp')
const fibers = require('fibers')
const sass = require('gulp-sass')
const del = require('del')
const imagemin = require('gulp-imagemin')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const babelify = require('babelify')
const browsersync = require('browser-sync')
const postcss = require('gulp-postcss')
const importer = require('postcss-import')
const autoprefixer = require('autoprefixer')
sass.compiler = require('sass')

const path = {
  src: './src/',
  build: './build/'
}

const clean = () => {
  return del(['build'])
}

const html = () => {
  let paths, srcFile
  if (process.env.NODE_ENV === 'develop') {
    paths = JSON.parse(fs.readFileSync('./src/config/develop.json'))
    srcFile = [path.src + '/**/*.ejs', '!' + path.src + '/**/_*.ejs']
  } else if (process.env.NODE_ENV === 'production') {
    paths = JSON.parse(fs.readFileSync('./src/config/production.json'))
    srcFile = [path.src + '/**/*.ejs', '!' + path.src + '/**/_*.ejs', '!' + path.src + '/index.ejs']
  }

  return src(srcFile)
    .pipe(ejs(paths))
    .pipe(rename({ extname: '.html' }))
    .pipe(dest(path.build))
}

const style = () => {
  let outputStyle
  if (process.env.NODE_ENV === 'develop') {
    outputStyle = 'compacted'
  } else if (process.env.NODE_ENV === 'production') {
    outputStyle = 'compressed'
  }

  return src(path.src + '/**/*.scss')
    .pipe(
      sass({
        fibers: fibers,
        outputStyle: outputStyle,
      })
    )
    .pipe(postcss([autoprefixer({cascade: false}), importer({ path: ['node_modules'] })]))
    .pipe(dest(path.build))
}

const script = () => {
  return browserify(path.src + 'assets/scripts/main.js')
    .transform(babelify, {presets: ['@babel/preset-env']})
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(dest(path.build + 'assets/scripts/'))
}

const image = () => {
  return src(path.src + '/**/*.{jpg,jpeg,png,gif,svg}')
    .pipe(
      imagemin([
        imagemin.optipng({
          quality: [0.65, 0.8],
          speed: 1,
        }),
        imagemin.mozjpeg({
          quality: 80,
        }),
      ])
    )
    .pipe(dest(path.dist))
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
