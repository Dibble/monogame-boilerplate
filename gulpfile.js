var os = require('os');
var exec = require('child_process').exec
var spawn = require('child_process').spawn;
var del = require('del');
var gulp = require('gulp');
var gutil = require('gulp-util');
var msbuild = require("gulp-msbuild");
var taskListing = require('gulp-task-listing');

var configuration = {
  cleanTargets: [
    'packages',
    'src/**/bin',
    'src/**/obj'
  ]
}

var isWindows = function() {
  return os.type() === 'Windows_NT';
}

var build = function(done) {
  if (isWindows()) {
    exec('xbuild ' + __dirname + '/Boilerplate.sln ' +
      '/target:Rebuild ' +
      '/verbosity:quiet ' +
      '/toolsversion:4.0 ' +
      '/nologo ' +
      '/property:Configuration=Debug',
      function (error, stdout, stderr) {
        var outputLines = stdout.split("\n");
        outputLines.forEach(function(line) {
          if (line.indexOf('warning CS') > 0) {
            console.log(gutil.colors.yellow(line));
          }
          else if (line.indexOf('error CS') > 0) {
            console.log(gutil.colors.red(line));
          }
          else {
            console.log(line);
          }
        });

        if (error !== null) {
          gutil.log(gutil.colors.red('Build failed!'));
        } else {
          gutil.log(gutil.colors.cyan('Build complete!'));
        }

        done();
    });
  } else {
    spawn('xbuild', [
      'Boilerplate.sln',
      '/target:Rebuild',
      '/verbosity:quiet',
      '/toolsversion:4.0',
      '/nologo',
      '/property:Configuration=Debug'
    ], {stdio:'inherit'})
    .on('error', function( err ){ throw err })
    .on('exit', function (err) {
      if (err) {
        gutil.log(gutil.colors.red('Build failed!'));
      } else {
        gutil.log(gutil.colors.cyan('Build complete!'));
      }
      done();
    });
  }
}

gulp.task('paket:bootstrap', function(done) {
  if (isWindows()) {
    spawn('.paket/paket.bootstrapper.exe',
    {stdio:'inherit'})
    .on('exit', function (err) {
      done()
    });
  } else {
    spawn('mono', [
      '.paket/paket.bootstrapper.exe'
    ], {stdio:'inherit'})
    .on('exit', function (err) {
      done()
    });
  }
});

gulp.task('paket:install', function(done) {
  if (isWindows()) {
    spawn('.paket/paket.exe', [
      'install'
    ], {stdio:'inherit'})
    .on('exit', function (err) {
      done()
    });
  } else {
    spawn('mono', [
      '.paket/paket.exe',
      'install'
    ], {stdio:'inherit'})
    .on('exit', function (err) {
      done()
    });
  }
});

gulp.task('help', taskListing);

gulp.task('init', ['paket:bootstrap']);

gulp.task('build', ['paket:install'], function (done) {
  build(done);
});

gulp.task('clean', function() {
   return del(configuration.cleanTargets);
});

gulp.task('default', ['build'], function() {
  gulp.watch(['./**/*.cs', './**/*.json', './**/*.csproj'], ['build']);
});
