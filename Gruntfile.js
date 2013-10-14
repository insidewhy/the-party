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
      sourceMaps: true,
      bare: true
    })
  })

  grunt.registerTask('buildTests', 'Compile tests', function() {
    var theparty = require('./lib/the-party')
    var cwd = process.cwd()

    var opts = {
      output: 'test',
      sourceMaps: true,
      dontRecurse: true,
      bare: true
    }
    theparty.compile(['src/test'], opts)
    opts.output = 'test/inc'
    theparty.compile(['src/test/inc'], opts)
  })

  grunt.registerTask('default', 'build')

  // build tests and run them
  grunt.registerTask('test', 'Build tests and run them.', function() {
    grunt.task.run('buildTests')
    grunt.task.run('mochaTest')
  })

  grunt.registerTask('testWeb', 'Run webserver test', function() {
    var theparty = require('./lib/the-party')
    var cwd = process.cwd()
    process.chdir('test/web')

    try {
      theparty.compile(['src'], { output: '.', sourceMaps: true, bare: true })

      var http = require('http'),
          fs   = require('fs')

      var files = {},
          readFile = function(file) { files[file] = fs.readFileSync(file) }

      readFile('src/code.js')
      readFile('code.js.map')
      readFile('code.js')
      readFile('index.html')
      files[''] = files['index.html']

      var done = this.async()

      http.createServer(function (req, res) {
        var forCompiled = req.url === '/code.js',
            header = {}


        header['Content-Type'] = /\.js$/.test(req.url) ?
          'text/javascript' : 'text/html'

        if (forCompiled)
          header['SourceMap'] = '/code.js.map'

        res.writeHead(200, header);

        res.end(files[req.url.substr(1)])
      }).listen(9674);
    }
    catch (e) {
      console.error(e)
    }
    process.chdir(cwd)
  })

  // Run all tasks
  grunt.registerTask('all', 'Bootstrap code and run tests.', function() {
    grunt.task.run('build')
    grunt.task.run('test')
  })
}
