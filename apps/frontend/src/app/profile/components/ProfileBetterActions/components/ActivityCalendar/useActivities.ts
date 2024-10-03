import dayjs from "dayjs"

export const useActivities = () => {
  const activities = [
    //23 aug
    {
      blockTimestamp: 1724419454,
    },
    {
      blockTimestamp: 1724419454,
    },
    {
      blockTimestamp: 1724419454,
    },
    {
      blockTimestamp: 1724419454,
    },
    // 5 sep
    {
      blockTimestamp: 1725525854,
    },
    {
      blockTimestamp: 1725525854,
    },
    {
      blockTimestamp: 1725525854,
    },
    // 17 sep
    {
      blockTimestamp: 1726562654,
    },
    {
      blockTimestamp: 1726562654,
    },
    {
      blockTimestamp: 1726562654,
    },
    {
      blockTimestamp: 1726562654,
    },
    {
      blockTimestamp: 1726562654,
    },
    {
      blockTimestamp: 1726562654,
    },
    // 19 sep
    {
      blockTimestamp: 1726735454,
    },
    {
      blockTimestamp: 1726735454,
    },
    {
      blockTimestamp: 1726735454,
    },
    {
      blockTimestamp: 1726735454,
    },
    {
      blockTimestamp: 1726735454,
    },
    // 23 sep
    {
      blockTimestamp: 1727081054,
    },
  ]

  // map activities to amount of activities per day
  const activitiesPerDay = activities.reduce(
    (acc, activity) => {
      const date = dayjs(activity.blockTimestamp * 1000).format("YYYY-MM-DD")
      acc[date] = (acc[date] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return {
    activitiesPerDay,
    isLoading: false,
  }
}
