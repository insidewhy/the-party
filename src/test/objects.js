module theparty from '../lib/the-party'
module chai from 'chai'

var expect = chai.expect, compile = theparty.compile

describe('objects', () => {
  it('Object shorthand field notation', () => {
    eval(compile('var f = 16, o = {f}'))
    expect(o.f).to.equal(16)
  })

  it('Object shorthand method notation', () => {
    eval(compile('var o = { m() { return 45 } }'))
    expect(o.m()).to.equal(45)
  })

  it('Caches object expression init', () => {
    eval(compile('var __i = 1; var m = () => ({ i: ++__i, j: ++__i });' +
                 'var {i, j} = m(); var {i: x, j: y} = m()'))

    expect(i).to.equal(2)
    expect(j).to.equal(3)
    expect(x).to.equal(4)
    expect(y).to.equal(5)
  })
})
