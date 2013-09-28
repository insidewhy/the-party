var readDir = require('fs').readdirSync

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test')

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: { test: {
      options: { reporter: 'spec' },
      src: [ 'test/**/*.js' ]
    } }
  })

  function getSources(dir) {
    var match = /\.js$/, exclude = /\.js\.js$/
    return readDir(dir).filter(function (f) {
      return match.test(f) && ! exclude.test(f)
    })
  }

  grunt.registerTask('build', 'Bootstrap compiler', function() {
    var theparty = require('./lib/the-party')
    var cwd = process.cwd()
    process.chdir('src')

    var srcs = getSources('.')
    theparty.compile(srcs, { output: '../lib', sourceMaps: true })
    process.chdir(cwd)
  })

  grunt.registerTask('buildTests', 'Compile tests', function() {
    var theparty = require('./lib/the-party')
    var cwd = process.cwd()
    process.chdir('src/test')

    var srcs = getSources('.')
    theparty.compile(srcs, { output: '../../test' })
    process.chdir(cwd)
  })

  grunt.registerTask('default', 'build')

  // build tests and run them
  grunt.registerTask('test', function() {
    grunt.task.run('buildTests')
    grunt.task.run('mochaTest')
  })
}
