var readDir = require('fs').readdirSync

module.exports = function(grunt) {
  grunt.initConfig({ pkg: grunt.file.readJSON('package.json') })
  grunt.registerTask('default', function() {
    var theparty = require('./lib/the-party')
    process.chdir('src')

    var match = /\.js$/, exclude = /\.js\.js$/
    var srcs = readDir('.').filter(function (f) {
      return match.test(f) && ! exclude.test(f)
    })

    theparty.compile(srcs, { output: '../lib', sourceMaps: true })
  })
}
