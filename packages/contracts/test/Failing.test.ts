// This is a temporary file to force the test to fail
import { expect } from "chai"

describe("Fail on purpose", function () {
  it.only("should fail", async function () {
    expect(true).to.eql(false)
  })
})
