import { timestampToTimeLeft, timestampToTimeLeftCompact } from "./date"

test("timestampToTimeLeftCompact", () => {
  // Test cases with custom start date
  expect(timestampToTimeLeftCompact(1634025600000, 1633940000000)).toBe("a day")

  // Test cases with small time differences
  expect(timestampToTimeLeftCompact(1634025605000, 1634025600000)).toBe("a few seconds")
  expect(timestampToTimeLeftCompact(1634025601000, 1634025590000)).toBe("a few seconds")
})

test("timestampToTimeLeft", () => {
  // Test cases with custom start date
  expect(timestampToTimeLeft(1634025600000, 1633940000000)).toBe("23h 46m 40s")

  // Test cases with small time differences
  expect(timestampToTimeLeft(1634025605000, 1634025600000)).toBe("5s")
  expect(timestampToTimeLeft(1634025601000, 1634025590000)).toBe("11s")
})
