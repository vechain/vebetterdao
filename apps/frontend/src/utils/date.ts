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

  if (difference < 0) {
    return "0 seconds"
  }

  let seconds = Math.floor(difference / 1000)
  let minutes = Math.floor(seconds / 60)
  seconds = seconds - minutes * 60
  let hours = Math.floor(minutes / 60)
  minutes = minutes - hours * 60
  let days = Math.floor(hours / 24)
  hours = hours - days * 24

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""}`
  }
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

  let seconds = Math.floor(difference / 1000)
  let minutes = Math.floor(seconds / 60)
  seconds = seconds - minutes * 60
  let hours = Math.floor(minutes / 60)
  minutes = minutes - hours * 60
  let days = Math.floor(hours / 24)
  hours = hours - days * 24
  let result = ""

  if (days > 0) {
    result += `${days}d `
  }
  if (days > 0 || hours > 0) {
    result += `${hours}h `
  }
  if (days > 0 || hours > 0 || minutes > 0) {
    result += `${minutes}m${days === 0 ? " " : ""}`
  }
  if (days === 0) {
    result += `${seconds}s`
  }

  return result
}
