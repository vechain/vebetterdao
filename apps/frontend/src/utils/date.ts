import { ThorClient } from "@vechain/vechain-kit"

import dayjs from "@/utils/dayjsConfig"

/**
 * Converts a timestamp to a compact time left string.
 * @param endDate - The end date timestamp.
 * @param startDate - The start date timestamp. Defaults to the current time.
 * @returns A string representing the time left in a compact format.
 * @example
 * timestampToTimeLeftCompact(1634025600000) => "3 days"
 */
export const timestampToTimeLeftCompact = (endDate: number, startDate: number = new Date().getTime()): string => {
  let difference = endDate - startDate
  return dayjs.duration(difference, "milliseconds").humanize(false)
}
/**
 * Converts a timestamp to a time left string.
 * @param endDate - The end date timestamp.
 * @param startDate - The start date timestamp. Defaults to the current time.
 * @returns A string representing the time left.
 * @example timestampToTimeLeft(1634025600000) => "3d 16h 12m"
 */
export const timestampToTimeLeft = (endDate: number, startDate: number = new Date().getTime()): string => {
  let difference = endDate - startDate
  if (difference < 0) {
    return "0s"
  }
  const dayjsObject = dayjs.duration(difference, "milliseconds")
  if (dayjsObject.days() > 0) {
    return dayjsObject.format("D[d] H[h] m[m] s[s]")
  }
  if (dayjsObject.hours() > 0) {
    return dayjsObject.format("H[h] m[m] s[s]")
  }
  if (dayjsObject.minutes() > 0) {
    return dayjsObject.format("m[m] s[s]")
  }
  return dayjsObject.format("s[s]")
}
/**
 * Converts a timestamp to a time left object with decomposed units.
 * @param endDate - The end date timestamp.
 * @param startDate - The start date timestamp. Defaults to the current time.
 * @returns An object with decomposed time units.
 * @example timestampToTimeLeftDecomposed(1634025600000) => { days: 3, hours: 16, minutes: 12, seconds: 0 }
 */
export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const timestampToTimeLeftDecomposed = (endDate: number, startDate: number = new Date().getTime()): TimeLeft => {
  let difference = endDate - startDate

  if (difference < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const dayjsObject = dayjs.duration(difference, "milliseconds")

  return {
    days: dayjsObject.days(),
    hours: dayjsObject.hours(),
    minutes: dayjsObject.minutes(),
    seconds: dayjsObject.seconds(),
  }
}

/**
 * Parses a date (provided as a Unix timestamp) and formats it to a human-readable string.
 * The formatted date string will be in the format "D MMM", where "D" is the day of the month
 * and "MMM" is the abbreviated month name.
 *
 * @param {number} date - The date represented as a Unix timestamp (milliseconds since epoch).
 * @returns {string} - The formatted date string in "D MMM" format.
 */
export const parseDate = (date: number): string => dayjs(date).format("D MMM")

const VECHAIN_BLOCK_TIME_SECONDS = 10
export const blockNumberToDate = (
  blockNumber: bigint,
  bestBlock?: Awaited<ReturnType<ThorClient["blocks"]["getBestBlockCompressed"]>>,
  currentBlockTimestamp?: number | null,
  currentBlockNumber?: bigint,
): Date => {
  let blockTs = currentBlockTimestamp
  let currentBlock = currentBlockNumber

  if (!blockTs || !currentBlock) {
    blockTs ??= bestBlock?.timestamp ?? Math.floor(Date.now() / 1000)
    currentBlock ??= bestBlock ? BigInt(bestBlock.number) : BigInt(0)
  }

  const blockDifference = blockNumber - currentBlock
  const timeOffsetSeconds = blockDifference * BigInt(VECHAIN_BLOCK_TIME_SECONDS)

  return new Date((Number(blockTs) + Number(timeOffsetSeconds)) * 1000)
}
