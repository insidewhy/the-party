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

    var opts = { output: 'test', sourceMaps: true, dontRecurse: true }
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
      theparty.compile(['src'], { output: '.', sourceMaps: true })

      var http = require('http'),
          fs   = require('fs')

      var source = fs.readFileSync('src/code.js'),
          sourceMap = fs.readFileSync('code.js.map'),
          compiled = fs.readFileSync('code.js'),
          indexPage = fs.readFileSync('index.html')

      var done = this.async()

      http.createServer(function (req, res) {
        console.log(req.url)
        var forSource = req.url === '/src/code.js',
            forCompiled = false,
            header = {}

        if (! forSource)
          forCompiled = req.url === '/code.js'

        header['Content-Type'] = (forSource || forCompiled) ?
          'text/javascript' : 'text/html'

        if (forCompiled)
          header['SourceMap'] = '/code.js.map'

        res.writeHead(200, header);

        if (forSource)
          res.end(source)
        else if (forCompiled)
          res.end(compiled)
        else if (req.url === '/code.js.map')
          res.end(sourceMap)
        else
          res.end(indexPage)
      }).listen(9674);
    }
    catch (e) {
    }
    process.chdir(cwd)
  })

  // Run all tasks
  grunt.registerTask('all', 'Bootstrap code and run tests.', function() {
    grunt.task.run('build')
    grunt.task.run('test')
  })
}
