import { TokensBalance } from "@/app/components/TokensBalance"
import { VStack, Heading } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UserTransactions } from "./components/UserTransactions"

type Props = {
  address: string
}
export const ProfileBalance = ({ address }: Props) => {
  const { t } = useTranslation()

  return (
    <VStack align={"stretch"} gap={4}>
      <Heading fontSize="lg" fontWeight={700}>
        {t("Your tokens")}
      </Heading>
      <TokensBalance address={address} />
      <UserTransactions address={address} />
    </VStack>
  )
}
