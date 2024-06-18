import { Button, HStack, Text } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import BigNumber from "bignumber.js"
import { UseFormSetValue } from "react-hook-form"
import { useBreakpoints } from "@/hooks"

type PercentageSelectorButtonsProps = {
  availableAmount: string
  setValue: UseFormSetValue<{ amount: string; reason: string }>
}

export const PercentageSelectorButtons: React.FC<PercentageSelectorButtonsProps> = ({ availableAmount, setValue }) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  const tenPercentButton = useMemo(
    () => (
      <Button
        onClick={() => setValue("amount", new BigNumber(availableAmount).times(0.1).toString())}
        w={"full"}
        h={"30px"}
        variant={"secondary"}>
        <Text fontSize={14} fontWeight={400}>
          {t("10%")}
        </Text>
      </Button>
    ),
    [availableAmount, setValue, t],
  )

  const twentyFivePercentButton = useMemo(
    () => (
      <Button
        onClick={() => setValue("amount", new BigNumber(availableAmount).times(0.25).toString())}
        w={"full"}
        h={"30px"}
        variant={"secondary"}>
        <Text fontSize={14} fontWeight={400}>
          {t("25%")}
        </Text>
      </Button>
    ),
    [availableAmount, setValue, t],
  )

  const fiftyPercentButton = useMemo(
    () => (
      <Button
        onClick={() => setValue("amount", new BigNumber(availableAmount).times(0.5).toString())}
        w={"full"}
        h={"30px"}
        variant={"secondary"}>
        <Text fontSize={14} fontWeight={400}>
          {t("50%")}
        </Text>
      </Button>
    ),
    [availableAmount, setValue, t],
  )

  const seventyFivePercentButton = useMemo(
    () => (
      <Button
        onClick={() => setValue("amount", new BigNumber(availableAmount).times(0.75).toString())}
        w={"full"}
        h={"30px"}
        variant={"secondary"}>
        <Text fontSize={14} fontWeight={400}>
          {t("75%")}
        </Text>
      </Button>
    ),
    [availableAmount, setValue, t],
  )

  const maxButton = useMemo(
    () => (
      <Button onClick={() => setValue("amount", availableAmount)} variant={"secondary"} w={"full"} h={"30px"}>
        <Text fontSize={14} fontWeight={400}>
          {isMobile ? t("100%") : t("Withdraw all")}
        </Text>
      </Button>
    ),
    [availableAmount, setValue, t, isMobile],
  )

  return (
    <HStack w="full" justify={"space-evenly"} mb={4}>
      {tenPercentButton}
      {twentyFivePercentButton}
      {fiftyPercentButton}
      {seventyFivePercentButton}
      {maxButton}
    </HStack>
  )
}
