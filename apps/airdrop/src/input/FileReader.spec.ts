import { cleanPath, readInputFile, readKeystoreFile } from "./FileReader"

describe("cleanPath", () => {
  it("should remove single quotes", () => {
    expect(cleanPath("'foo'")).toBe("foo")
  })

  it("should remove double quotes", () => {
    expect(cleanPath('"foo"')).toBe("foo")
  })

  it("should remove single and double quotes", () => {
    expect(cleanPath("'foo\"")).toBe("foo")
  })

  it("should remove whitespace", () => {
    expect(cleanPath(" foo ")).toBe("foo")
  })

  it("should remove whitespace and quotes", () => {
    expect(cleanPath(" 'foo' ")).toBe("foo")
  })

  it("should allow alphanumberic to pass through", () => {
    expect(cleanPath("foo123")).toBe("foo123")
  })
})

describe("readInputFile", () => {
  it("should return an array of Recipients", async () => {
    const recipients = await readInputFile("./test/data/input-fund-pool.json")
    expect(recipients).toBeDefined()
    expect(recipients.length).toBe(4)
    expect(recipients[0].address).toBe("0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa")
    expect(recipients[0].amount).toBe("10000000")
    expect(recipients[1].address).toBe("0x435933c8064b4Ae76bE665428e0307eF2cCFBD68")
    expect(recipients[1].amount).toBe("10000000")
    expect(recipients[2].address).toBe("0x0F872421Dc479F3c11eDd89512731814D0598dB5")
    expect(recipients[2].amount).toBe("10000000")
    expect(recipients[3].address).toBe("0xF370940aBDBd2583bC80bfc19d19bc216C88Ccf0")
    expect(recipients[3].amount).toBe("20000000")
  })

  it("should throw an error if the file doesn't exist", async () => {
    await expect(readInputFile("./test/data/file-doesnt-exist.json")).rejects.toThrow(
      "Failed to load file. Please ensure the path is correct and the file exists",
    )
  })

  it("should throw an error if the file doesn't contain valid JSON", async () => {
    await expect(readInputFile("./test/data/invalid-json.json")).rejects.toThrow(
      "Failed to parse input file. Please ensure the file contains valid JSON",
    )
  })

  it("should throw an error if the file doesn't contain recipients", async () => {
    await expect(readInputFile("./test/data/valid-json-no-recipients.json")).rejects.toThrow(
      "Input file does not contain recipients",
    )
  })
})

describe("readKeystoreFile", () => {
  it("should return a Keystore", () => {
    const keystore = readKeystoreFile("./test/data/test-keystore.json")
    expect(keystore).toBeDefined()
  })

  it("should throw and error is file doesn't exist", () => {
    expect(() => readKeystoreFile("./test/file-doesnt-exist.json")).toThrow(
      "Failed to load file. Please ensure the path is correct and the file exists",
    )
  })

  it("should throw and error is file doesn't contain valid JSON", () => {
    expect(() => readKeystoreFile("./test/data/invalid-json.json")).toThrow(
      "Failed to parse keystore file. Please ensure the file contains valid JSON",
    )
  })
})
