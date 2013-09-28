module theparty from '../lib/the-party'
module chai from 'chai'

var expect = chai.expect, compile = theparty.compile

describe('objects', () => {
  it('Object shorthand notation', () => {
    eval(compile('var f = 16, o = {f}'))
    expect(o.f).to.equal(16)
  })
})
