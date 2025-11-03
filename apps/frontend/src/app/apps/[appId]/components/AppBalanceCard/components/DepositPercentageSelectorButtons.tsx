import { Button, SimpleGrid } from "@chakra-ui/react"
import BigNumber from "bignumber.js"
import { UseFormSetValue } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useBreakpoints } from "../../../../../../hooks/useBreakpoints"

type PercentageSelectorButtonsProps = {
  availableAmount: string
  setValue: UseFormSetValue<{ amount: string }>
}
const DEPOSIT_PERCENTAGES = [0.1, 0.25, 0.5, 0.75, 1] as const
export const DepositPercentageSelectorButtons: React.FC<PercentageSelectorButtonsProps> = ({
  availableAmount,
  setValue,
}) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  return (
    <SimpleGrid columns={5} gap="4" my="4" w="full">
      {DEPOSIT_PERCENTAGES.map(percentage => (
        <Button
          key={percentage.toString()}
          onClick={() => {
            setValue("amount", new BigNumber(availableAmount).times(percentage).toString())
          }}
          variant="secondary"
          w={"full"}
          h={"30px"}
          textStyle="md">
          {percentage === 1 ? (isMobile ? `${percentage * 100}%` : t("All")) : `${percentage * 100}%`}
        </Button>
      ))}
    </SimpleGrid>
  )
}
