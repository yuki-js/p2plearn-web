

var gulp=require("gulp");
var plumber = require("gulp-plumber");
var sass = require("gulp-sass");
var runSequence = require('run-sequence');
//var browser = require("browser-sync").create();
var browserify = require("browserify")
var source = require('vinyl-source-stream');
var buffer = require("vinyl-buffer")
var uglify =require("gulp-uglify")

gulp.task('js-prod', function(){
  browserify({
    entries: ['js/index.js']
  })
    .ignore(require.resolve("../p2plearn-server/node_modules/ws"))
    .transform("babelify",{presets:["es2015"]})
    .transform("browserify-conditionalify",{
     definitions:{
        isNode:false
      }
    })
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('dist/'));
});

gulp.task('js-dev', function(){
  browserify({
    entries: ['js/index.js']
  })
    .ignore(require.resolve("../p2plearn-server/node_modules/ws"))
    .transform("babelify",{presets:["es2015"]})
    .transform("browserify-conditionalify",{
     definitions:{
        isNode:false
      }
    })
    .bundle()
    .pipe(source('main.js'))
    //.pipe(buffer())
    //.pipe(uglify())
    .pipe(gulp.dest('dist/'));
});


gulp.task("sass", function() {
  gulp.src("./scss/style.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(gulp.dest("./dist"))
    //.pipe(browser.stream());
});
gulp.task("watch", function() {
  gulp.watch("scss/*.scss",["sass"]);
  gulp.watch("js/**/*.js",["js-dev"]);
});
gulp.task("default", function(cb) {
  return runSequence(
    ['sass',"js-dev"],
    'watch',
    cb
  );
  
});
gulp.task("prod", function(cb) {
  return runSequence(
    ['sass',"js-prod"],
    cb
  );
  
});
