module common from './inc/common'
var expect = common.expect, compile = common.compile

describe('modules', () => {
  // module fs from 'fs'
  it('export variable declaration', () => {
    var exports = {}
    eval(compile('export var a = 16'))
    expect(exports.a).to.equal(16)
    expect(a).to.equal(16)
  })

  it('export variable declarations', () => {
    var exports = {}
    eval(compile('export var b = 32, c = 64'))
    expect(exports.b).to.equal(32)
    expect(b).to.equal(32)
    expect(exports.c).to.equal(64)
    expect(c).to.equal(64)
  })

  it('export variable complex variable declaration', () => {
    var exports = {}
    eval(compile('o = {}; export var a = o.a = 32'))
    expect(o.a).to.equal(32)
    expect(a).to.equal(32)
    expect(exports.a).to.equal(32)
  })

  it('export function', () => {
    var exports = {}
    eval(compile('export function friend() { return "yes" }'))
    expect(friend()).to.equal('yes')
    expect(exports.friend()).to.equal('yes')
  })
})
