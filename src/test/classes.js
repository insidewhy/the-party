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
})
