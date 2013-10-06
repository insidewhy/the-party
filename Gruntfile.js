var readDir = require('fs').readdirSync,
    path    = require('path')

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test')

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: { test: {
      options: { reporter: 'spec' },
      src: [ 'test/*.js' ]
    } }
  })

  grunt.registerTask('build', 'Bootstrap compiler', function() {
    var theparty = require('./lib/the-party')

    theparty.compile(['src'], {
      output: 'lib',
      dontRecurse: true,
      sourceMaps: true
    })
  })

  grunt.registerTask('buildTests', 'Compile tests', function() {
    var theparty = require('./lib/the-party')
    var cwd = process.cwd()

    theparty.compile(['src/test'], { output: 'test', sourceMaps: true  })
  })

  grunt.registerTask('default', 'build')

  // build tests and run them
  grunt.registerTask('test', 'Build tests and run them.', function() {
    grunt.task.run('buildTests')
    grunt.task.run('mochaTest')
  })

  grunt.registerTask('test-web', 'Run webserver test', function() {
  })

  // Run all tasks
  grunt.registerTask('all', 'Bootstrap code and run tests.', function() {
    grunt.task.run('build')
    grunt.task.run('test')
  })
}
