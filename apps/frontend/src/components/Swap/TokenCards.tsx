import { useTokenColors } from "@/hooks"
import { Button, Divider, HStack, Input, Stack, Text, VStack } from "@chakra-ui/react"
import { useCallback, useEffect, useMemo } from "react"
import { Controller, UseFormReturn } from "react-hook-form"
import { B3TRIcon, VOT3Icon } from "../Icons"
import { useB3trBalance, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"

const DECIMAL_PLACES = 2

// Maximum precision of 2 decimals. Must also round down
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

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance?.scaled])

  const maxBalance = useMemo(
    () => (isB3trToVot3 ? b3trBalanceScaled : vot3BalanceScaled),
    [isB3trToVot3, b3trBalanceScaled, vot3BalanceScaled],
  )

  const filterAmount = useCallback(
    (text: string) => {
      const filteredAmount = text
        .replace(",", ".") // Replace comma with dot
        .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
        .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators

      if (Number(filteredAmount) > Number(maxBalance)) {
        return maxBalance
      }
      return filteredAmount
    },
    [b3trBalanceScaled, isB3trToVot3, vot3BalanceScaled, maxBalance],
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
    <Stack direction={isB3trToVot3 ? "column" : "column-reverse"}>
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
          <VStack justify="stretch" flex={1}>
            <HStack justify={"space-between"} w="full">
              <Text>{isB3trToVot3 ? "You Send" : "You Get"}</Text>
              <Text fontSize="14px" fontWeight={500}>
                Balance: {compactFormatter.format(Number(b3trBalanceScaled))} B3
              </Text>
            </HStack>
            <HStack w="full">
              <HStack flex={1}>
                <B3TRIcon size={32} />
                {amountInput}
              </HStack>
              {isB3trToVot3 && Number(maxBalance) !== Number(amount) && maxButton}
            </HStack>
          </VStack>
        </HStack>
      </VStack>
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
          <VStack justify="stretch" flex={1}>
            <HStack justify={"space-between"} w="full">
              <Text>{isB3trToVot3 ? "You Get" : "You Send"}</Text>
              <Text fontSize="14px" fontWeight={500}>
                Balance: {compactFormatter.format(Number(b3trBalanceScaled))} V3
              </Text>
            </HStack>
            <HStack w="full">
              <HStack flex={1}>
                <B3TRIcon size={32} />
                {amountInput}
              </HStack>
              {!isB3trToVot3 && Number(maxBalance) !== Number(amount) && maxButton}
            </HStack>
          </VStack>
        </HStack>
      </VStack>
    </Stack>
  )
}
