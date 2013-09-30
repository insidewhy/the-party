import {expect, compile} from './inc/common'

describe('patterns', () => {
  it('Simple object pattern variable declaration', () => {
    eval(compile('var o = { x: 1, y: 2 };' +
                 'var {x, y} = o, { x: a, y: b } = o;'))

    expect(x).to.equal(1)
    expect(y).to.equal(2)
    expect(a).to.equal(1)
    expect(b).to.equal(2)
  })

  it('Recursive object pattern variable declaration', () => {
    eval(compile('var o = { x: 1, y: { a: 2, b: 3 } };' +
                 'var { y: { a, b: c } } = o;'))
    expect(a).to.equal(2)
    expect(c).to.equal(3)
  })

  it('Caches object pattern init', () => {
    eval(compile('var __i = 1; var m = () => ({ i: ++__i, j: ++__i });' +
                 'var {i, j} = m(); var {i: x, j: y} = m()'))

    expect(i).to.equal(2)
    expect(j).to.equal(3)
    expect(x).to.equal(4)
    expect(y).to.equal(5)
  })

  it('Array pattern', () => {
    eval(compile('var [x, y] = [ 42, 96 ]'))
    expect(x).to.equal(42)
    expect(y).to.equal(96)
  })

  it('Array pattern with gaps', () => {
    eval(compile('var [ , x,, y ] = [ 0, 1, 2, 3 ]'))
    expect(x).to.equal(1)
    expect(y).to.equal(3)
  })

  it('Array pattern nested in array pattern', () => {
    eval(compile('var [ [x, y], [a] ] = [ [ 1, 6 ], [ 9 ] ]'))
    expect(x).to.equal(1)
    expect(y).to.equal(6)
    expect(a).to.equal(9)
  })

  it('Array pattern nested in object pattern', () => {
    eval(compile('var { f: [ a, b ] } = { f: [ 16, 24 ] }'))
    expect(a).to.equal(16)
    expect(b).to.equal(24)
  })

  it('Object pattern nested in array pattern', () => {
    eval(compile('var [ { f, a: b } ] = [ { f: 29, a: 32 } ]'))
    expect(f).to.equal(29)
    expect(b).to.equal(32)
  })
})
