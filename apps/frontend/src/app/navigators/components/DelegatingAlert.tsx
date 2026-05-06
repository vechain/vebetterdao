import { Alert, Button } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LuUserCheck } from "react-icons/lu"

import { useMyDelegationInfo } from "@/api/indexer/navigators/useMyDelegationInfo"

const formatter = getCompactFormatter(2)

type Props = {
  amount: number
  navigatorAddress: string
}

export const DelegatingAlert = ({ amount, navigatorAddress }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: delegationInfo } = useMyDelegationInfo(navigatorAddress)
  const { data: domainData } = useVechainDomain(navigatorAddress)

  const name = domainData?.domain ? humanDomain(domainData.domain, 20, 10) : humanAddress(navigatorAddress, 6, 4)

  return (
    <Alert.Root status="info" borderRadius="xl" alignItems="center">
      <Alert.Indicator>
        <LuUserCheck />
      </Alert.Indicator>
      <Alert.Title textStyle="sm" flex={1}>
        {t("You are delegating {{amount}} VOT3 to {{name}}", {
          amount: formatter.format(amount),
          name,
        })}
        {delegationInfo?.delegatedAt &&
          ` ${t("since {{date}}", {
            date: new Date(delegationInfo.delegatedAt * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          })}`}
      </Alert.Title>
      <Button size="xs" variant="secondary" onClick={() => router.push(`/navigators/${navigatorAddress}`)}>
        {t("Go to Navigator")}
      </Button>
    </Alert.Root>
  )
}
