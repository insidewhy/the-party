import {expect, compile} from './inc/common'

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

  it('import module', () => {
    eval(compile('module mod from "./inc/mod"'))
    expect(mod.times2(4)).to.equal(8)
  })

  it('import one symbol from module', () => {
    eval(compile('import times2 from "./inc/mod"'))
    expect(times2(6)).to.equal(12)
  })

  it('import multiple symbols from module', () => {
    eval(compile('import {times2, friend} from "./inc/mod"'))
    expect(times2(8)).to.equal(16)
    expect(friend("me")).to.equal("totoro:me")
  })

  it('import multiple symbols from module, renaming one symbol', () => {
    eval(compile('import {times2, friend as happy} from "./inc/mod"'))
    expect(times2(7)).to.equal(14)
    expect(happy("you")).to.equal("totoro:you")
  })
})
