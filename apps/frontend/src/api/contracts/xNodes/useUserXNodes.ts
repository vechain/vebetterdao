import { useWallet, useXNodes } from "@vechain/vechain-kit"

/**
 *  Hook to get the owned or delegated xNodes for a user from the NodeManagement contract
 * @returns  the xNodes for the user
 */
export const useUserXNodes = () => {
  const { account } = useWallet()
  return useXNodes(account?.address || undefined)
}
