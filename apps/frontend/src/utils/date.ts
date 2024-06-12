import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import duration from "dayjs/plugin/duration"

dayjs.extend(relativeTime)
dayjs.extend(duration)
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
 * Parses a date (provided as a Unix timestamp) and formats it to a human-readable string.
 * The formatted date string will be in the format "D MMM", where "D" is the day of the month
 * and "MMM" is the abbreviated month name.
 *
 * @param {number} date - The date represented as a Unix timestamp (milliseconds since epoch).
 * @returns {string} - The formatted date string in "D MMM" format.
 */
export const parseDate = (date: number): string => dayjs(date).format("D MMM")
