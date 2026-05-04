import { Button } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { DelegationModal } from "@/app/navigators/shared/DelegationModal"
import { useGetVot3UnlockedBalance } from "@/hooks/useGetVot3UnlockedBalance"

import { GenericBanner } from "../../Banners/GenericBanner"

export const UndelegatedVot3Banner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const [isDelegationOpen, setIsDelegationOpen] = useState(false)

  const { data: navigatorAddress = "" } = useGetNavigator(account?.address)
  const { data: navigatorData } = useNavigatorByAddress(navigatorAddress ?? "")
  const { data: vot3Balance } = useGetVot3UnlockedBalance(account?.address)

  const handleDelegate = useCallback(() => {
    setIsDelegationOpen(true)
  }, [])

  const amount = FormattingUtils.humanNumber(vot3Balance?.scaled ?? "0")

  return (
    <>
      <GenericBanner
        title={t("Power up!")}
        illustration="/assets/3d-illustrations/voting-power-hr.png"
        illustrationDimensions={{
          width: { base: "120px", md: "180px" },
          height: { base: "120px", md: "180px" },
        }}
        description={t("You have {{amount}} undelegated VOT3 — delegate to boost voting power.", { amount })}
        cta={
          <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={handleDelegate}>
            {t("Delegate now")}
          </Button>
        }
      />
      {navigatorData && (
        <DelegationModal
          isOpen={isDelegationOpen}
          onClose={() => setIsDelegationOpen(false)}
          navigator={navigatorData}
        />
      )}
    </>
  )
}
