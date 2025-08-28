import { B3TRIcon, VOT3Icon } from "@/components/Icons"
import { HStack, VStack, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  isB3TR: boolean
  balanceScaled: string
}

const compactFormatter = getCompactFormatter(4)

export const BalanceInfo = ({ isB3TR, balanceScaled }: Props) => {
  const { t } = useTranslation()
  const title = useMemo(() => {
    return isB3TR ? t("Total B3TR Balance") : t("Total VOT3 Balance")
  }, [isB3TR, t])

  const image = useMemo(() => {
    return isB3TR ? <B3TRIcon boxSize={"32px"} /> : <VOT3Icon boxSize={"32px"} />
  }, [isB3TR])

  const bgColor = useMemo(() => {
    return isB3TR ? "#E5EEFF" : "#E3FFC4"
  }, [isB3TR])

  const dataTestId = useMemo(() => {
    return isB3TR ? "B3TR-balance" : "VOT3-balance"
  }, [isB3TR])

  return (
    <HStack bg={bgColor} py={6} px={6} h="full" w="full" borderRadius={"2xl"} align="flex-start" gap={12}>
      <HStack align={"stretch"} justify={"stretch"} gap={4}>
        <VStack align="self-start">
          <Text textStyle="sm" fontWeight="400">
            {title}
          </Text>
          <HStack>
            {image}
            <Text textStyle="3xl" fontWeight={700} data-testid={dataTestId}>
              {compactFormatter.format(Number(balanceScaled))}
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </HStack>
  )
}
