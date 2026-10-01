import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ZeroAddress } from "ethers"

import { useVot3Delegates } from "../../api/contracts/vot3/hooks/useVot3Delegates"

export const useVot3RequireSelfDelegation = () => {
  const { account } = useWallet()
  // isSuccess, not !isLoading: a query that has not run yet is neither loading nor errored, and an
  // unread delegatee is indistinguishable from one that is genuinely the zero address because
  // compareAddresses returns false for undefined — that is how the self delegation clause was being
  // dropped silently. With no account there is nothing to read; the clause builders reject that case.
  const { data: vot3DelegatedAddress, isSuccess } = useVot3Delegates(account?.address)
  const isDelegatedToZeroAddress = compareAddresses(vot3DelegatedAddress, ZeroAddress)

  // VOT3._update only auto self-delegates when the receiver is not a contract, so every smart account
  // (Privy, cross-app, VeWorld smart wallet...) needs the explicit clause. Gating on the wallet type
  // missed non-Privy smart accounts; for an EOA with no delegatee the extra clause is harmless.
  return {
    requiresSelfDelegation: isDelegatedToZeroAddress,
    isDelegationStatusUnknown: !!account?.address && !isSuccess,
  }
}
