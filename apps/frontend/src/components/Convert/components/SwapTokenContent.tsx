import { TokenBalance } from "@/api"
import { ModalCloseButton, VStack, Text, HStack, Flex, Button } from "@chakra-ui/react"
import { t } from "i18next"
import { UseFormReturn } from "react-hook-form"
import { FiInfo } from "react-icons/fi"
import { IoArrowBackOutline } from "react-icons/io5"
import { TokenCards } from "../TokenCards"
import { BalanceInfo } from "./BalanceInfo"

type Props = {
  amount: string
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void
  formData: UseFormReturn<{ amount: string }>
  isB3trToVot3?: boolean
  swappableVot3Balance?: TokenBalance
  isVOT3BalanceMoreThanStakedB3TR: boolean
  convertTitle: string
  convertDescription: JSX.Element
  b3trBalanceScaled: string
  vot3BalanceScaled: string
  handleGoBack: () => void
  disableSubmitButton: boolean
  isSubmitButtonLoading: boolean
}

export const SwapTokenContent = ({
  amount,
  onSubmit,
  formData,
  isB3trToVot3,
  swappableVot3Balance,
  isVOT3BalanceMoreThanStakedB3TR,
  convertTitle,
  convertDescription,
  b3trBalanceScaled,
  vot3BalanceScaled,
  handleGoBack,
  disableSubmitButton,
  isSubmitButtonLoading,
}: Props) => {
  return (
    <form onSubmit={onSubmit}>
      <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
      <VStack align={"flex-start"} maxW={"590px"} px={{ base: 0, md: 4 }}>
        <HStack>
          <IoArrowBackOutline onClick={handleGoBack} size={20} cursor={"pointer"} />
          <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
            {convertTitle}
          </Text>
        </HStack>
        {convertDescription}

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
          type="submit"
          variant={"primaryAction"}
          w={"full"}
          rounded={"full"}
          isDisabled={disableSubmitButton}
          isLoading={isSubmitButtonLoading}
          size={"lg"}
          data-testid={"confirm-swap-button"}>
          <Text fontSize={{ base: 14, md: 18 }}>{t("Convert now")}</Text>
        </Button>
      </VStack>
    </form>
  )
}
