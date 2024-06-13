import { useAppAdmin } from "@/api"
import { useParams } from "next/navigation"

/**
 * Custom hook to fetch the current app admin.
 * @returns An object containing the admin data, loading state, and error state.
 */
export const useCurrentAppAdmin = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: admin, isLoading, error } = useAppAdmin(appId)

  return {
    admin,
    isLoading,
    error,
  }
}
