import HexUtils from "./HexUtils"
import { expect, describe } from "vitest"

const hexLowercaseHasPrefix = "0x38983243287eef8773264910fe003"
const hexLowercaseNoPrefix = "38983243287eef8773264910fe003"
const hexUppercaseHasPrefixUppercase = "0X38983243287EEF8773264910FE003"
const hexUppercaseHasPrefixLowercase = "0x38983243287EEF8773264910FE003"
const hexUppercaseNoPrefix = "38983243287EEF8773264910FE003"
const hexMixedcaseHasPrefix = "0x38983243287eEf8773264910Fe003"
const hexMixedcaseNoPrefix = "38983243287eEf8773264910Fe003"
const invalidHex = "0xfsdjkvbdjkfbkjn"
const hexMultiplePrefixes = "0x0X38983243287eef8773264910fe003"

describe.each([
    {
        sample: hexLowercaseHasPrefix,
        expected: hexLowercaseNoPrefix,
        throws: false,
    },
    {
        sample: hexUppercaseHasPrefixUppercase,
        expected: hexUppercaseNoPrefix,
        throws: false,
    },
    {
        sample: hexUppercaseNoPrefix,
        expected: hexUppercaseNoPrefix,
        throws: false,
    },
    {
        sample: hexMixedcaseHasPrefix,
        expected: hexMixedcaseNoPrefix,
        throws: false,
    },
    {
        sample: hexMixedcaseNoPrefix,
        expected: hexMixedcaseNoPrefix,
        throws: false,
    },
    { sample: invalidHex, expected: null, throws: true },
    { sample: hexMultiplePrefixes, expected: null, throws: true },
])("Remove prefix $#", ({ sample, expected, throws }) => {
    if (throws) {
        test("Expect to throw", () => {
            expect(() => HexUtils.addPrefix(sample)).toThrow()
        })
    } else {
        test("Result as expected", () => {
            const result = HexUtils.removePrefix(sample)
            expect(result).toBe(expected)
        })
    }
})

describe.each([
    {
        sample: hexLowercaseHasPrefix,
        expected: hexLowercaseHasPrefix,
        throws: false,
    },
    {
        sample: hexLowercaseNoPrefix,
        expected: hexLowercaseHasPrefix,
        throws: false,
    },
    {
        sample: hexUppercaseHasPrefixUppercase,
        expected: hexUppercaseHasPrefixLowercase,
        throws: false,
    },
    {
        sample: hexUppercaseNoPrefix,
        expected: hexUppercaseHasPrefixLowercase,
        throws: false,
    },
    {
        sample: hexMixedcaseHasPrefix,
        expected: hexMixedcaseHasPrefix,
        throws: false,
    },
    {
        sample: hexMixedcaseNoPrefix,
        expected: hexMixedcaseHasPrefix,
        throws: false,
    },
    { sample: invalidHex, expected: null, throws: true },
    { sample: hexMultiplePrefixes, expected: null, throws: true },
])("Add prefix $#", ({ sample, expected, throws }) => {
    if (throws) {
        test("Expect to throw", () => {
            expect(() => HexUtils.addPrefix(sample)).toThrow()
        })
    } else {
        test("Result as expected", () => {
            const result = HexUtils.addPrefix(sample)
            expect(result).toBe(expected)
        })
    }
})

describe.each([
    { sample: hexLowercaseHasPrefix, throws: false },
    { sample: hexLowercaseNoPrefix, throws: false },
    { sample: hexUppercaseHasPrefixUppercase, throws: false },
    { sample: hexUppercaseHasPrefixLowercase, throws: false },
    { sample: hexUppercaseNoPrefix, throws: false },
    { sample: hexMixedcaseHasPrefix, throws: false },
    { sample: hexMixedcaseNoPrefix, throws: false },
    { sample: invalidHex, throws: true },
    { sample: hexMultiplePrefixes, throws: true },
])("Validate hex $#", ({ sample, throws }) => {
    if (throws) {
        test("Expect to throw", () => {
            expect(() => HexUtils.validate(sample)).toThrow()
        })
    } else {
        test("Result as expected", () => {
            expect(() => HexUtils.validate(sample)).not.toThrow()
        })
    }
})

describe.each([
    { sample: hexLowercaseHasPrefix, throws: false },
    { sample: hexLowercaseNoPrefix, throws: false },
    { sample: hexUppercaseHasPrefixUppercase, throws: false },
    { sample: hexUppercaseHasPrefixUppercase, throws: false },
    { sample: hexUppercaseHasPrefixLowercase, throws: false },
    { sample: hexUppercaseNoPrefix, throws: false },
    { sample: hexMixedcaseNoPrefix, throws: false },
    { sample: invalidHex, throws: true },
    { sample: hexMultiplePrefixes, throws: true },
])("is Valid hex $#", ({ sample, throws }) => {
    if (throws) {
        test("Expect to throw", () => {
            expect(HexUtils.isValid(sample)).toBeFalsy()
        })
    } else {
        test("Result as expected", () => {
            expect(HexUtils.isValid(sample)).toBeTruthy()
        })
    }
})
