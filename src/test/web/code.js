class ParentTester {
  constructor() {
    console.log("constructing parent")
  }
}

class Tester extends ParentTester {
  constructor() {
    console.log("constructing test")
    super()
  }

  throw1() {
    var helper = a => {
      if (a > 2)
        throw Error("some error")
    }

    helper(1)
    helper(2)
    helper(3)
  }
}

var tester = null

function makeTester() {
  tester = new Tester
}

function throw1() {
  tester.throw1()
}

makeTester()
