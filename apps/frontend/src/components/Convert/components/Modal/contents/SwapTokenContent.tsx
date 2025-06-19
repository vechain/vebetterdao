import { Text, HStack, Flex, Button } from "@chakra-ui/react"
import { t } from "i18next"
import { UseFormReturn } from "react-hook-form"
import { FiInfo } from "react-icons/fi"
import { TokenCards } from "../../TokenCards"
import { BalanceInfo } from "../../BalanceInfo"
import { TokenBalance } from "@vechain/vechain-kit"

type Props = {
  amount: string
  goToNextStep: () => void
  formData: UseFormReturn<{ amount: string }>
  isB3trToVot3?: boolean
  swappableVot3Balance?: TokenBalance
  isVOT3BalanceMoreThanStakedB3TR: boolean
  b3trBalanceScaled: string
  vot3BalanceScaled: string
  disableSubmitButton: boolean
}

export const SwapTokenContent = ({
  amount,
  goToNextStep,
  formData,
  isB3trToVot3,
  swappableVot3Balance,
  isVOT3BalanceMoreThanStakedB3TR,
  b3trBalanceScaled,
  vot3BalanceScaled,
  disableSubmitButton,
}: Props) => {
  return (
    <>
      <Flex
        flexDirection={{
          base: isB3trToVot3 ? "column" : "column-reverse",
          md: isB3trToVot3 ? "row" : "row-reverse",
        }}
        w={"full"}
        gap={4}
        mt={{ base: 2, md: 4 }}
        // hide if below 667px height
        css={
          !isB3trToVot3 &&
          isVOT3BalanceMoreThanStakedB3TR && {
            "@media (max-height: 667px)": {
              display: "none",
            },
          }
        }>
        <BalanceInfo isB3TR={true} balanceScaled={b3trBalanceScaled} />
        <BalanceInfo isB3TR={false} balanceScaled={vot3BalanceScaled} />
      </Flex>

      {!isB3trToVot3 && isVOT3BalanceMoreThanStakedB3TR && (
        <HStack px={4} py={3} bg={"#F8F8F8"} borderRadius={8} mt={2}>
          <FiInfo size={36} color="#6a6a6a" />
          <Text fontSize={{ base: 14 }} fontWeight={400}>
            {t("The maximum amount of VOT3 you can convert is ")}
            <b>{swappableVot3Balance?.formatted}</b>
            {t(". You can’t convert VOT3 that ")}
            <b>{t("someone else transferred to you.")}</b>
          </Text>
        </HStack>
      )}

      <TokenCards
        amount={amount}
        formData={formData}
        isB3trToVot3={isB3trToVot3 ?? false}
        swappableVot3Balance={swappableVot3Balance}
        isVOT3BalanceMoreThanStakedB3TR={isVOT3BalanceMoreThanStakedB3TR}
      />

      <Button
        mt={2}
        variant={"primaryAction"}
        w={"full"}
        rounded={"full"}
        isDisabled={disableSubmitButton}
        onClick={goToNextStep}
        size={"lg"}
        data-testid={"confirm-swap-button"}>
        <Text fontSize={{ base: 14, md: 18 }}>{t("Review operation")}</Text>
      </Button>
    </>
  )
}
