# the-party

This tool takes code written in the latest version of JavaScript (EcmaScript 6) and outputs code written in the current version (EcmaScript 5) so that it can be used in all browsers from IE9+ and most non-IE browsers.

 * Support for source maps, this means stack traces show line numbers and columns from the original source, not the transpiled code.
 * Generated code works in:
   * CommonJS systems (node/phantom).
   * AMD module systems (require).
   * Non-modular systems (by concatenating modules with their dependencies into a single output file).
 * Test cases for all features (using mocha).
 * Uses esprima for parsing and escodegen for code generation, allows codebase to be small and fast (can compile itself in less than 0.2 seconds on a reasonably powerful laptop).
 * Grunt task runner to make development a bit easier.

## Usage
    $ the-party -h

    Usage: the-party [options]

    Options:

      -h, --help          output usage information
      -o, --output <dir>  Output compiled JavaScript files to <dir>
      -d, --dump          Dump ASTs
      -L, --dump-locs     Include locs in dump
      -S, --dump-sources  Dump source ASTs rather than compiled ASTs
      -m, --source-maps   Generate source maps

# Support

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
}

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
function isEven(a) a % 2 // => function isEven(a) { return a % 2 }
```

### Arrow functions
```JavaScript
var happyPrint = a => { console.log('totoro', a) }
var isEven = a => a % 2
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
