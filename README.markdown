# the-party

This tool takes code written in the up-and-coming version of JavaScript (EcmaScript 6) and outputs code written in the current version (EcmaScript 5) so that it can be used in all browsers from IE9+ and most non-IE browsers.

 * Support for source maps, this means stack traces show line numbers and columns from the original source, not the transpiled code.
 * Generated code works in:
   * CommonJS systems (node/phantom).
   * AMD module systems (require).
   * Non-modular systems (by concatenating modules with their dependencies into a single output file).
 * Test cases for all features (using mocha).
 * Uses esprima for parsing and escodegen for code generation, allows source code to be small and fast (can compile itself in less than 0.5 seconds on a mid-powered laptop).
 * Grunt task runner to make development a bit easier.

## Usage
    $ the-party -h

    Usage: the-party [options]

    Options:

      -h, --help                output usage information
      -b, --bare                Compile without define wrapper, suitable for commonJS module system
      -c, --compile             Compile output files into same directory as sources
      -d, --dependencies        Compile dependencies of files listed on command-line
      -m, --source-maps         Generate source maps
      -o, --output <dir>        Output compiled JavaScript files to <dir>
      -O, --output-file <file>  Compile input files with dependencies into <file>
      -D, --dump                Dump ASTs
      -R, --dont-recurse        Do not recurse into directory arguments
      -L, --dump-locs           Include locs in dump
      -S, --dump-sources        Dump source ASTs rather than compiled ASTs

## Installation

    npm install -g the-party

## Examples

### Compile source directory into multiple files suitable for Require
Compile all files with extensions "es6" or "js" recursively reachable from the directory "source" to the directory "build" with output suitable for a require compatible loader:

    the-party -o build source

Output files have the extension "es6" replaced with "js" and the-party will issue a warning instead of overwriting a source file.

### Compile into multiple files suitable for node.js
Compile files main.js and lib.js, outputting the compiled files to the directory "build" with output suitable for a commonJS type module system such as node.js:

    the-party -bo build main.js lib.js

### Build sources with dependencies
Compile file main.js and all of its transitively reachable dependencies, outputting the compiled files to the directory "build":

    the-party -do build main.js

### Many sources into single output file
Compile file main.es6 and all of its transitively reachable dependencies, outputting the compiled files to the single output file main.js which is a self-contained file that will work with or without any module loader system (browsers/node.js/phantom etc.). This also produces a map file which will relate the single output file to all of the source files.

    the-party -mO main.js main.es6

### Compile output files into same directory as source files.
Compile files to the same directories as their source files. In this case the source files must have the extension "es6" which will be replaced by "js" for the output files:

    the-party -c main.es6 lib.es6 otherfile.es6

# Supported EcmaScript 6 features

## Modules

### Module loading
```JavaScript
module fs from 'fs' // var fs = require('fs')
import join from 'path' // var join = require('path').join
// var $$1 = require('console'), log = $$1.log, shout = $$1.error
import {log, error as shout} from 'console'
```

### Exporting variables from a module
```JavaScript
export var a = 16  // var a = exports.a = 16
```

### Exporting functions from a module
```JavaScript
export function help() { return "yes!" }
```

## Classes
```JavaScript
class Animal {
  constructor(type, name, sound) {
    this.sound = sound
    console.log("created new", type, "called", name)
  }

  play() {
    console.log(this.type, "goes", this.sound)
    return "give me some food"
  }
}

var rebeccaTheOtter = new Animal("otter", "Rebecca", "cute noises")
console.log("she likes to play:", rebeccaTheOtter.play())
console.log(rebeccaTheOtter instanceof Animal) // true
```

### Child classes
```JavaScript
class Cat extends Animal {
  constructor(name) {
    // call superclass constructor
    super("cat", name, "meow")
  }

  play() {
    // call superclass method
    return super.play() + " then stroke my head"
  }
}

var michaelTheCat = new Cat("michael")
console.log("he likes to play:", michaelTheCat.play())
console.log(michaelTheCat instanceof Cat) // true
console.log(michaelTheCat instanceof Animal) // true
```

### Class expressions
```JavaScript
var getClass(prefix) {
  return new class { say(stuff) { console.log(prefix, stuff) } }
}

var friendConsole = getConsole("friend")
friendConsole.say("hello")
```

## Functions

### Closure expression functions
```JavaScript
function isOdd(a) a % 2 // => function isOdd(a) { return a % 2 }
```

### Arrow functions
```JavaScript
var happyPrint = a => { console.log('totoro', a) }
var isOdd = a => a % 2
```

### Rest parameters
```JavaScript
function toArray(p1, p2, ...p3on) {
  // p3on will be an array of any extra parameters passed after p2
}
```

## Objects

### Object shorthand field notation
```JavaScript
var field = 16,
    object = { field }  // equivalent to { field: field }
```

### Object shorthand method notation
```JavaScript
// equivalent to { m: function() { return "method" } }
var o = { m() { return "method" } }
```

### Destructuring assignment
```JavaScript
var o = { x: 1, y: 2 }
var {x, y} = o        // equivalent to var x = o.x, y = o.y;
var {x: a, y: b} = o  // equivalent to var a = o.x, b = o.y;

var m = () => ({ p: ++o.x, q: ++o.y })
// equivalent to var $$1 = m(), p = $$1.p, q = $$1.q
var {p, q} = m()

o = { x: 1, y: { a: 2, b: 3 } }
// equivalent to: var $$2 = o.y; a = $$2.a; c = $$2.b
var { y: {a, b: c}} = o; // a = 2, c = 3

var list = [ 0, 1, 2, 3 ]
var [ a, b ] = list // var a = 0, b = 1
var [ , b, , c ] = list // var b = 1, c = 3
```

## A note on modules

Modules paths not beginning with "./" or "../" are assumed to be common modules and are not attempted to be resolved by the compiler.

Modules paths beginning with "./" or "../" are assumed to be relative modules and are loaded when the --output-file or --dependencies options are used. The source code should not use the file extension ".js" or ".es6" in module import statements so a file in the current module path "file.es6" would be referenced as such:

```JavaScript
module file from './file'
```

Not:
```JavaScript
module file from './file.es6'
```
