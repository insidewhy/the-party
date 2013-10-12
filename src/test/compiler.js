import expect from './inc/common'
import {exec as procExec} from 'child_process'

var cwd = process.cwd()
var COMPILER = cwd + '/bin/the-party'

/// execute many commands.
/// @param commands  An array of commands to execute
/// @param done Called back if any command fails or if they all succeed.
///             The current mocha test is failed if any command fails else
///             it is suceeded.
var exec = (commands, done) => {
  if (commands.length === 0) {
    expect(true).to.be.ok
    done()
    return
  }

  var command = commands.shift()
  procExec(command, (error, stdout, stderr) => {
    if (error !== null) {
      if (stderr)
        console.error(stderr)
      else if (stdout)
        console.error(stdout)

      expect('failed: ' + command).to.equal('')
      done()
    }
    else {
      exec(commands, done)
    }
  })
}

var output = path => 'test/compiler/' + path
var o = path => ' -o ' + output(path) + ' '
var arg = path => 'src/test/compiler/' + path

describe('compiler', () => {
  it('Compiles with maps to output directory (-m and -o arguments)', done => {
    var test   = 'deps-across-dirs',
        outDir = output(test),
        inDir  = arg(test)
    exec([
      'rm -rf ' + outDir,
      COMPILER + ' -m ' + o(test) + inDir,
      'diff -r ' + outDir + ' ' + inDir + '.out'
    ], done)
  })
})

