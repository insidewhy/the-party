// TODO:
// export expect from 'chain'
// export theparty from '../../lib/the-party'
module theparty from '../../lib/the-party'
module chai from 'chai'

export var expect = chai.expect,
           compile = (arg, opts) => {
             if (! opts)
               opts = {}
             if (opts.bare === undefined)
               opts.bare = true

             return theparty.compile(arg, opts)
           }
