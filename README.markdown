# the-party

The best ES6 to ES5 transpiler with support for source maps!

## Usage

    $ the-party -h

    Usage: the-party [options]

    Options:

      -h, --help          output usage information
      -o, --output <dir>  Output transpiled files to <dir>
      -d, --dump          Dump ASTs
       --dump-locs        Include locs in dump
       --dump-sources     Dump source ASTs rather than compiled ASTs
      -m, --source-maps   Generate source maps

## Support

### Module loading

    module fs from 'fs'
