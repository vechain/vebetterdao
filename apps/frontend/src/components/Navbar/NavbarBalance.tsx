import { useVot3Balance } from "@/api"
import { HStack, Image, Skeleton, Text, useMediaQuery } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useGetB3trBalance, useWallet } from "@vechain/vechain-kit"

const compactFormatter = getCompactFormatter(1)

export const NavbarBalance = () => {
  const { account } = useWallet()
  const { data: b3trBalance, isLoading: b3trBalanceLoading } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance, isLoading: vot3BalanceLoading } = useVot3Balance(account?.address ?? undefined)

  const [isDesktop] = useMediaQuery("(min-width: 1060px)")

  if (!account?.address) {
    return null
  }

  const cardHeight = isDesktop ? "37px" : "26px"
  const iconHeight = isDesktop ? "20px" : "15px"
  const fontSize = isDesktop ? "14px" : "12px"
  const padding = isDesktop ? "8px 20px" : "4px 10px"

  return (
    <Skeleton isLoaded={!b3trBalanceLoading && !vot3BalanceLoading}>
      <HStack flexBasis="250px" gap={0} h={cardHeight} pl={5}>
        <HStack gap={0} align="flex-start">
          <HStack gap={1} bg="#004CFC" borderLeftRadius="full" p={padding} pr="0">
            <Image h={iconHeight} w={iconHeight} src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Text color="#FFFFFF" fontSize={fontSize} fontWeight={600}>
              {compactFormatter.format(Number(b3trBalance?.scaled ?? 0))}
            </Text>
          </HStack>
          <Image h={cardHeight} src="/assets/images/balance-ending-right.webp" alt="balance-ending-right" ml="-1px" />
        </HStack>
        <HStack gap={0} align="flex-start" h={cardHeight}>
          <Image h={cardHeight} src="/assets/images/balance-ending-left.webp" alt="balance-ending-left" />
          <HStack gap={1} bg="#B1F16C" borderRightRadius="full" p={padding} pl="0">
            <Image h={iconHeight} w={iconHeight} src="/assets/tokens/vot3-token.webp" alt="vot3-token" />
            <Text color="#000000" fontSize={fontSize} fontWeight={600}>
              {compactFormatter.format(Number(vot3Balance?.scaled ?? 0))}
            </Text>
          </HStack>
        </HStack>
      </HStack>
    </Skeleton>
  )
}
