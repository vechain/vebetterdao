import { useGetB3trBalance, useGetVot3Balance } from "@/hooks"
import { Flex, HStack, Image, Skeleton, Text, useMediaQuery } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"

import { BalancePill } from "./BalancePill"

const compactFormatter = getCompactFormatter(1)

export const NavbarBalance = () => {
  const { account } = useWallet()
  const { data: b3trBalance, isLoading: b3trBalanceLoading } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance, isLoading: vot3BalanceLoading } = useGetVot3Balance(account?.address ?? undefined)
  const [isDesktop] = useMediaQuery(["(min-width: 1060px)"])

  if (!account?.address) {
    return null
  }

  const cardHeight = isDesktop ? "33px" : "26px"

  return (
    <Skeleton loading={b3trBalanceLoading || vot3BalanceLoading}>
      <HStack flexBasis="250px" gap={0} h={cardHeight} pl={5}>
        <BalancePill variant="b3tr">
          <Flex align="center" justify="center" px={1} gap="0.25rem">
            <Image aspectRatio={1} h="20px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Text color="actions.primary.text" fontWeight={600}>
              {compactFormatter.format(Number(b3trBalance?.scaled ?? 0))}
            </Text>
          </Flex>
        </BalancePill>

        <BalancePill variant="vot3">
          <Flex align="center" justify="center" px={1} gap="0.25rem">
            <Image aspectRatio={1} h="20px" src="/assets/tokens/vot3-token.webp" alt="vot3-token" />
            <Text color="black" fontWeight={600}>
              {compactFormatter.format(Number(vot3Balance?.scaled ?? 0))}
            </Text>
          </Flex>
        </BalancePill>
      </HStack>
    </Skeleton>
  )
}
