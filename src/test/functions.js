module common from './inc/common'
var expect = common.expect, compile = common.compile

describe('functions', () => {
  it('simplified function expressions', () => {
    eval(compile('var isEven = function (a) a % 2 === 0'))
    expect(isEven(2)).to.equal(true)
    expect(isEven(3)).to.equal(false)
  })

  it('simplified function declarations', () => {
    eval(compile('function isEven(a) a % 2 === 0'))
    expect(isEven(4)).to.equal(true)
    expect(isEven(5)).to.equal(false)
  })

  it('arrow functions', () => {
    eval(compile('var isEven = a => { return a % 2 === 0 }'))
    expect(isEven(6)).to.equal(true)
    expect(isEven(7)).to.equal(false)
  })

  it('simplified arrow functions', () => {
    eval(compile('var isEven = a => a % 2 === 0'))
    expect(isEven(8)).to.equal(true)
    expect(isEven(9)).to.equal(false)
  })

  it('functions with rest parameters', () => {
    eval(compile('function tail(a, ...b) { return b }'))
    expect(tail(1,2,3)).to.eql([2, 3])

    eval(compile('function toArray(...b) { return b }'))
    expect(toArray(1,2,3)).to.eql([1, 2, 3])
  })
})
