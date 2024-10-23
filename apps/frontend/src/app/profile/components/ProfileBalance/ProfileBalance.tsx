import { TokensBalance } from "@/app/components/TokensBalance"
import { VStack, Heading } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UserTransactions } from "./components/UserTransactions"

export const ProfileBalance = () => {
  const { t } = useTranslation()

  return (
    <VStack align={"stretch"} gap={4}>
      <Heading fontSize="lg" fontWeight={700}>
        {t("Your tokens")}
      </Heading>
      <TokensBalance />
      <UserTransactions />
    </VStack>
  )
}
