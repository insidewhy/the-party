# the-party

The best ES6 to ES5 transpiler!
  * Support for source maps!
  * Generated code works in:
    * CommonJS systems (node/phantom)
    * AMD module systems (require)
    * Non-modular systems (by concatenating modules with their dependencies into a single output file).

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

## Support

### Module loading
    module fs from 'fs'

### Shorter functions
    function isEven(a) a % 2 // => function isEven(a) { return a % 2 }

### Arrow functions
    var happyPrint = a => { console.log('totoro', a) }
    var isEven = a => a % 2

### Rest parameters
    function toArray(p1, p2, ...p3on) {
      // p3on will be an array of any extra parameters passed after p2
    }
