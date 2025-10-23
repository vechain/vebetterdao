import { useParams } from "next/navigation"

import { useAppAdmin } from "../../../../api/contracts/xApps/hooks/useAppAdmin"

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
