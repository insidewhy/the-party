import {expect, compile} from './inc/common'

describe('classes', () => {
  it('constructor', () => {
    eval(compile('class C { constructor(x) { this.x = x + 14 } }'))
    var c = new C(4)
    expect(c.x).to.equal(18)
    expect(c instanceof C).to.be.ok
  })

  it('method', () => {
    eval(compile('class C { friend(a) { return "friend:" +  a } }'))
    expect(new C(4).friend("baby")).to.equal("friend:baby")
  })

  it('extends', () => {
    eval(compile('class P { m() { return "t" } }; class C extends P {}'))
    var c = new C
    expect(c instanceof C).to.be.ok
    expect(c instanceof P).to.be.ok
    expect(c.m()).to.equal("t")
  })

  it('call constructor with super', () => {
    eval(compile('class P { constructor(y) { this.y = y + 1 } };' +
                 'class C extends P { constructor() { super(5) } }'))
    var c = new C
    expect(c.y).to.equal(6)
  })

  it('call parent method with super', () => {
    eval(compile('class P { m(y) { return "cat" + y } };' +
                 'class C extends P { m() { return super.m("friend") } }'))
    var c = new C
    expect(c.m()).to.equal("catfriend")
  })

  it('class expression', () => {
    eval(compile(
      'var C = class { m() { return new class { m() { return "op" } } } }'))

    var c = new C
    expect(c instanceof C).to.be.ok
    expect(c.m().m()).to.equal("op")
  })
})
