import { HStack, VStack, Text, Image } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"

type Props = {
  isB3TR: boolean
  balanceScaled: string
}

const compactFormatter = getCompactFormatter(4)

export const BalanceInfo = ({ isB3TR, balanceScaled }: Props) => {
  const title = useMemo(() => {
    return isB3TR ? "Total B3TR Balance" : "Total VOT3 Balance"
  }, [isB3TR])

  const image = useMemo(() => {
    return isB3TR ? "/images/logo/b3tr_logo_dark.svg" : "/images/logo/vot3_logo_dark.svg"
  }, [isB3TR])

  const bgColor = useMemo(() => {
    return isB3TR ? "#E5EEFF" : "#E3FFC4"
  }, [isB3TR])

  return (
    <HStack bg={bgColor} py={6} px={6} h="full" w="full" borderRadius={"2xl"} align="flex-start" spacing={12}>
      <HStack align={"stretch"} justify={"stretch"} spacing={4}>
        <VStack align="self-start">
          <Text fontSize="14px" fontWeight="400">
            {title}
          </Text>
          <HStack>
            <Image src={image} boxSize={"32px"} alt="B3TR Icon" />
            <Text fontSize={28} fontWeight={700} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              {compactFormatter.format(Number(balanceScaled))}
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </HStack>
  )
}
