import { VStack, Heading } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { TokensBalance } from "@/app/components/TokensBalance"

import { UserTransactions } from "./components/UserTransactions"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  address: string
}
export const ProfileBalance = ({ address }: Props) => {
  const { t } = useTranslation()
  const { account: connectedAccount } = useWallet()
  const isConnectedUser = compareAddresses(connectedAccount ?? "", address)

  return (
    <VStack align={"stretch"} gap={4}>
      <Heading fontSize="lg" fontWeight={700}>
        {isConnectedUser ? t("Your tokens") : t("Tokens")}
      </Heading>
      <TokensBalance address={address} />
      <UserTransactions address={address} />
    </VStack>
  )
}
