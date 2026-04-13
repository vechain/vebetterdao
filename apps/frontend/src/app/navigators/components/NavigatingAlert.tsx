import { Alert, Button } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LuCompass } from "react-icons/lu"

import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"

const formatter = getCompactFormatter(2)

export const NavigatingAlert = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { data: navigator } = useNavigatorByAddress(account?.address || "")

  if (!navigator) return null

  return (
    <Alert.Root status="info" borderRadius="xl" alignItems="center">
      <Alert.Indicator>
        <LuCompass />
      </Alert.Indicator>
      <Alert.Title textStyle="sm" flex={1}>
        {t("You are a navigator with {{count}} citizens and {{amount}} VOT3 delegated", {
          count: navigator.citizenCount,
          amount: formatter.format(Number(navigator.totalDelegatedFormatted)),
        })}
      </Alert.Title>
      <Button size="xs" variant="secondary" onClick={() => router.push(`/navigators/${account?.address}`)}>
        {t("Manage")}
      </Button>
    </Alert.Root>
  )
}
