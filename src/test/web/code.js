class Tester {
  throw1() {
    throw Error("some error")
  }
}

var tester = new Tester

function throw1() {
  tester.throw1()
}
