import { useTokenColors } from "@/hooks"
import { Button, Divider, HStack, Input, Stack, Text, VStack } from "@chakra-ui/react"
import { useCallback, useEffect, useMemo } from "react"
import { Controller, UseFormReturn } from "react-hook-form"
import { B3TRIcon, VOT3Icon } from "../Icons"
import { useB3trBalance, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { motion } from "framer-motion"

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: DECIMAL_PLACES,
})

type Props = {
  amount: string
  isB3trToVot3: boolean
  formData: UseFormReturn<{ amount: string }>
}

export const TokenCards = ({ isB3trToVot3, formData, amount }: Props) => {
  const { b3trBgGradient, vot3BgGradient, b3trDividerColor, vot3dividerAlpha } = useTokenColors()
  const { account } = useWallet()

  const { data: b3trBalance } = useB3trBalance(account ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account ?? undefined)
  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance?.scaled])

  const b3trBalanceText = useMemo(() => {
    const b3trBalance = Number(b3trBalanceScaled)

    if (b3trBalance === 0) return "0"

    if (b3trBalance < 0.0001) return `< 0.${"0".repeat(DECIMAL_PLACES - 1)}1`
    return compactFormatter.format(b3trBalance)
  }, [b3trBalanceScaled])

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance?.scaled])

  const vot3BalanceText = useMemo(() => {
    const vot3Balance = Number(vot3BalanceScaled)

    if (vot3Balance === 0) return "0"

    if (vot3Balance < 0.0001) return `< 0.${"0".repeat(DECIMAL_PLACES - 1)}1`
    return compactFormatter.format(vot3Balance)
  }, [vot3BalanceScaled])

  const maxBalance = useMemo(
    () => (isB3trToVot3 ? b3trBalanceScaled : vot3BalanceScaled),
    [isB3trToVot3, b3trBalanceScaled, vot3BalanceScaled],
  )

  const containerVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  }

  const layoutTransition = {
    type: "spring",
    stiffness: 300,
    damping: 24,
  }

  const filterAmount = useCallback(
    (text: string) => {
      const filteredAmount = text
        .replace(",", ".") // Replace comma with dot
        .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
        .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
        .replace(/(\.\d{18})\d+/, "$1") // remove digits after 18th decimal

      if (Number(filteredAmount) > Number(maxBalance)) {
        return maxBalance
      }
      return filteredAmount
    },
    [maxBalance],
  )

  const { control, setValue } = formData
  const amountInput = useMemo(() => {
    return (
      <Controller
        name="amount"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Input
            h="50px"
            placeholder="0"
            fontSize="40px"
            fontWeight={700}
            type="text"
            value={value}
            onChange={e => onChange(filterAmount(e.target.value))}
            variant="unstyled"
            _placeholder={{ color: "black" }}
          />
        )}
      />
    )
  }, [filterAmount, control])

  useEffect(() => {
    // I needed a useEffect here because inside the callback the isB3trToVot3 wan not updated
    if (amount === "") return
    setValue("amount", filterAmount(amount))
  }, [isB3trToVot3, amount])

  const maxButton = useMemo(
    () => (
      <Button
        onClick={() => setValue("amount", maxBalance)}
        size="xs"
        color={"white"}
        rounded={"full"}
        bgColor="primary.400">
        Max
      </Button>
    ),
    [maxBalance],
  )

  return (
    <motion.div initial="initial" animate="animate" variants={containerVariants}>
      <Stack direction={isB3trToVot3 ? "column" : "column-reverse"}>
        <motion.div layout transition={layoutTransition}>
          <VStack
            bgGradient={b3trBgGradient}
            py={6}
            px={6}
            h="full"
            w="full"
            borderRadius={"2xl"}
            align="flex-start"
            spacing={12}>
            <HStack align={"stretch"} justify={"stretch"} spacing={4} w="full">
              <Divider
                orientation="vertical"
                variant="thick"
                w="4px"
                bgColor={b3trDividerColor}
                h="auto"
                borderRadius="7px"
              />
              <VStack justify="stretch" flex={1} gap={1}>
                <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                  <Text>{isB3trToVot3 ? "Send" : "Receive"}</Text>
                  <VStack gap={0} alignItems={"flex-end"}>
                    <Text fontSize="10px">B3TR Balance</Text>
                    <HStack gap={1}>
                      <Text fontSize="14px" fontWeight={500}>
                        {b3trBalanceText}
                      </Text>
                      <B3TRIcon h={"15px"} w={"15px"} />
                    </HStack>
                  </VStack>
                </HStack>
                <HStack w="full">
                  <HStack flex={1}>
                    <B3TRIcon h={"32px"} w={"32px"} />
                    {amountInput}
                  </HStack>
                  {isB3trToVot3 && Number(maxBalance) !== Number(amount) && maxButton}
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </motion.div>
        <motion.div layout transition={layoutTransition}>
          <VStack
            bgGradient={vot3BgGradient}
            py={6}
            px={6}
            h="full"
            w="full"
            borderRadius={"2xl"}
            align="flex-start"
            spacing={12}>
            <HStack align={"stretch"} justify={"stretch"} spacing={4} w="full">
              <Divider
                orientation="vertical"
                variant="thick"
                w="4px"
                bgColor={vot3dividerAlpha}
                h="auto"
                borderRadius="7px"
              />
              <VStack justify="stretch" flex={1} gap={1}>
                <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                  <Text>{isB3trToVot3 ? "Receive" : "Send"}</Text>
                  <VStack gap={0} alignItems={"flex-end"}>
                    <Text fontSize="10px">VOT3 Balance</Text>
                    <HStack gap={1}>
                      <Text fontSize="14px" fontWeight={500}>
                        {vot3BalanceText}
                      </Text>
                      <VOT3Icon h={"15px"} w={"15px"} />
                    </HStack>
                  </VStack>
                </HStack>
                <HStack w="full">
                  <HStack flex={1}>
                    <VOT3Icon h={"32px"} w={"32px"} />
                    {amountInput}
                  </HStack>
                  {!isB3trToVot3 && Number(maxBalance) !== Number(amount) && maxButton}
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </motion.div>
      </Stack>
    </motion.div>
  )
}
