import BigNumber from "bignumber.js"

import { scaledDivision } from "../../../../../utils/MathUtils/MathUtils"

/**
 *  This function splits the votes evenly between the apps (each app gets the same percentage of votes)
 * @param appsNumber  The number of apps to split the votes between
 * @returns  An object containing the value and rawValue of the percentage of votes to be allocated to each app
 */
export const splitEvenly = (appsNumber: number) => {
  const rawValue = scaledDivision(100, appsNumber)
  // const remainingPercentage = 100 - rawValue * totalAppsToVote
  const votesPerApp = new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN)
  // in case the division is not exact, we add the remaining percentage to a random app
  // const randomAppIndex = Math.floor(Math.random() * totalAppsToVote)
  return {
    value: votesPerApp,
    rawValue,
  }
}
