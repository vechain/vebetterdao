import { useAppEndorsementStatus, GetAllApps } from "@/api" // Import the necessary hook

const getAllAppEndorsementStatus = (xApps: GetAllApps) => {
  const map = new Map()
  xApps.allApps.forEach(app => {
    const { status } = useAppEndorsementStatus(app.id)
    map.set(app.id, status)
  })
  console.log("map", map)
  return map
}

export default getAllAppEndorsementStatus
