import { useB3trBalance, useVot3Balance } from "@/api"
import {
  Card,
  CardBody,
  Heading,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stack,
  Box,
  VStack,
  Show,
  Flex,
  Text,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react"
import { WalletButton, useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { SwapB3trButton } from "./SwapB3trButton"
import { getConfig } from "@repo/config"
import { backdropBlurAnimation } from "@/app/theme"
import { B3TRIcon, VOT3Icon } from "./Icons"

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: DECIMAL_PLACES,
})

type Props = {}
/**
 * BalanceCard displays the balance of the current account
 * @returns BalanceCard
 */
export const BalanceCard: React.FC<Props> = () => {
  const { account } = useWallet()

  const bgGradientFirst = useColorModeValue("100", "200")
  const bgGradientSecond = useColorModeValue("50", "100")
  const dividerColor = useColorModeValue("500", "600")

  const {
    data: b3trBalance,
    isLoading: b3trBalanceLoading,
    error: b3trBalanceError,
  } = useB3trBalance(account ?? undefined)
  const {
    data: vot3Balance,
    isLoading: vot3BalanceLoading,
    error: vot3BalanceError,
  } = useVot3Balance(account ?? undefined)

  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance])

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance])

  const isLoading = b3trBalanceLoading || vot3BalanceLoading

  const hasNoBalance = useMemo(() => {
    return b3trBalance?.scaled === "0" && vot3Balance?.scaled === "0"
  }, [b3trBalance, vot3Balance])

  if (b3trBalanceError || vot3BalanceError)
    return (
      <Alert status="error" borderRadius={"lg"}>
        <AlertIcon />
        <AlertTitle>Error fetching your balances</AlertTitle>
        <AlertDescription>{b3trBalanceError?.message ?? vot3BalanceError?.message}</AlertDescription>
      </Alert>
    )

  if (hasNoBalance)
    return (
      <Stack direction={["column", "column", "row"]} spacing={8} w="full">
        <Alert status="warning" borderRadius={"lg"}>
          <AlertIcon />
          <Box>
            <AlertTitle>You have no balance</AlertTitle>
            <AlertDescription>Interact with x2Earn dapps to get started!</AlertDescription>
          </Box>
        </Alert>
      </Stack>
    )

  const mobileBalance = (
    <VStack spacing={6} w="full" color={"black"}>
      <VStack
        bgGradient={`linear(to-r, primary.${bgGradientFirst}, primary.${bgGradientSecond})`}
        py={6}
        px={6}
        h="full"
        w="full"
        borderRadius={"2xl"}
        align="flex-start"
        spacing={12}>
        <HStack align={"stretch"} justify={"stretch"} spacing={4}>
          <Divider
            orientation="vertical"
            variant="thick"
            w="4px"
            bgColor={`primary.${dividerColor}`}
            h="auto"
            borderRadius="7px"
          />
          <VStack align="self-start">
            <B3TRIcon size={32} />
            <Heading size="2xl" fontWeight={900}>
              {compactFormatter.format(Number(b3trBalanceScaled))}
            </Heading>
            <Text fontSize="16px" fontWeight="500">
              B3TR Tokens
            </Text>
          </VStack>
        </HStack>
      </VStack>
      <VStack
        bgGradient={`linear(to-r, secondary.${bgGradientFirst}, secondary.${bgGradientSecond})`}
        py={6}
        px={6}
        h="full"
        w="full"
        borderRadius={"2xl"}
        align="flex-start"
        spacing={12}>
        <HStack align={"stretch"} justify={"stretch"} spacing={4}>
          <Divider
            orientation="vertical"
            variant="thick"
            w="4px"
            bgColor={`secondary.${dividerColor}`}
            h="auto"
            borderRadius="7px"
          />
          <VStack align="self-start">
            <VOT3Icon size={32} />
            <Heading size="2xl" fontWeight={900}>
              {compactFormatter.format(Number(vot3BalanceScaled))}
            </Heading>
            <Text fontSize="16px" fontWeight="500">
              VOT3 Tokens
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  )

  const desktopBalance = (
    <HStack justify={"space-between"} w="full" spacing={6} color={"black"}>
      <VStack
        bgGradient={`linear(to-r, primary.${bgGradientFirst}, primary.${bgGradientSecond})`}
        py={6}
        px={6}
        h="full"
        w="full"
        borderRadius={"2xl"}
        align="flex-start"
        spacing={12}>
        <HStack align={"stretch"} justify={"stretch"} spacing={4}>
          <Divider
            orientation="vertical"
            variant="thick"
            w="4px"
            bgColor={`primary.${dividerColor}`}
            h="auto"
            borderRadius="7px"
          />
          <VStack align="self-start">
            <B3TRIcon size={32} />
            <Heading size="2xl" fontWeight={900}>
              {compactFormatter.format(Number(b3trBalanceScaled))}
            </Heading>
            <Text fontSize="16px" fontWeight="500">
              B3TR Tokens
            </Text>
          </VStack>
        </HStack>
      </VStack>
      <VStack
        bgGradient={`linear(to-r, secondary.${bgGradientFirst}, secondary.${bgGradientSecond})`}
        py={6}
        px={6}
        h="full"
        w="full"
        borderRadius={"2xl"}
        align="flex-start"
        spacing={12}>
        <HStack align={"stretch"} justify={"stretch"} spacing={4}>
          <Divider
            orientation="vertical"
            variant="thick"
            w="4px"
            bgColor={`secondary.${dividerColor}`}
            h="auto"
            borderRadius="7px"
          />
          <VStack align="self-start">
            <VOT3Icon size={32} />
            <Heading size="2xl" fontWeight={900}>
              {compactFormatter.format(Number(vot3BalanceScaled))}
            </Heading>
            <Text fontSize="16px" fontWeight="500">
              VOT3 Tokens
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </HStack>
  )

  return (
    <Card w="full">
      <CardBody>
        <VStack spacing={4} align="flex-start">
          <HStack justify={"space-between"} w="full">
            <Heading size="md">Balance</Heading>
            <Flex>{isLoading ? <Spinner size="sm" /> : <SwapB3trButton />}</Flex>
          </HStack>
          <Show below="sm">{mobileBalance}</Show>
          <Show above="sm">{desktopBalance}</Show>
        </VStack>
      </CardBody>
      {!account && (
        <Flex
          backdropFilter="blur(10px)"
          animation={backdropBlurAnimation("0px", "10px")}
          position={"absolute"}
          h={"100%"}
          w={"100%"}
          align="center"
          justify="center">
          <Card w={["90%", "50%", "40%"]} rounded="xl" variant="outline">
            <CardBody>
              <VStack gap={4}>
                <Heading fontSize="xl" textAlign={"center"}>
                  No wallet connected
                </Heading>
                <Text textAlign={"center"} fontSize="lg" fontWeight={"thin"}>
                  Connect your wallet to check your balance
                </Text>
                <WalletButton />
              </VStack>
            </CardBody>
          </Card>
        </Flex>
      )}
    </Card>
  )
}
