import { Button, HStack, Input, Stack, Text, VStack, Image } from "@chakra-ui/react"
import { useCallback, useEffect, useMemo } from "react"
import { Controller, UseFormReturn } from "react-hook-form"
import { useVot3Balance } from "@/api"
import { TokenBalance, useGetB3trBalance, useWallet } from "@vechain/vechain-kit"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { B3TRIcon } from "@/components/Icons"

type Props = {
  amount: string
  isB3trToVot3: boolean
  formData: UseFormReturn<{ amount: string }>
  swappableVot3Balance?: TokenBalance
  isVOT3BalanceMoreThanStakedB3TR?: boolean
}

export const TokenCards = ({
  isB3trToVot3,
  formData,
  amount,
  swappableVot3Balance,
  isVOT3BalanceMoreThanStakedB3TR,
}: Props) => {
  const { account } = useWallet()

  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account?.address ?? undefined)
  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance?.scaled])

  const vot3BalanceScaled = useMemo(() => {
    if (!vot3Balance || !swappableVot3Balance) return "0"

    return isVOT3BalanceMoreThanStakedB3TR ? swappableVot3Balance.scaled : vot3Balance.scaled
  }, [isVOT3BalanceMoreThanStakedB3TR, swappableVot3Balance, vot3Balance])

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
            fontSize={{ base: 30, md: 36 }}
            fontWeight={700}
            type="text"
            value={value}
            onChange={e => onChange(filterAmount(e.target.value))}
            variant="unstyled"
            _placeholder={{ color: "black" }}
            data-testid={"amount-input"}
          />
        )}
      />
    )
  }, [filterAmount, control])

  useEffect(() => {
    // I needed a useEffect here because inside the callback the isB3trToVot3 wan not updated
    if (amount === "") return
    setValue("amount", filterAmount(amount))
  }, [isB3trToVot3, amount, filterAmount, setValue])

  const { t } = useTranslation()

  const renderMaxButton = useMemo(
    () => (
      <Button onClick={() => setValue("amount", maxBalance)} variant={"secondary"} data-testid={"convert-all-button"}>
        <Text fontSize={14} fontWeight={500}>
          {t("Convert all")}
        </Text>
      </Button>
    ),
    [maxBalance, setValue, t],
  )

  return (
    <motion.div initial="initial" animate="animate" variants={containerVariants} style={{ width: "100%" }}>
      <Stack direction={isB3trToVot3 ? "column" : "column-reverse"} w="full">
        <motion.div layout transition={layoutTransition}>
          <VStack
            py={3}
            h="full"
            w="full"
            align="flex-start"
            spacing={12}
            borderBottomWidth={2}
            borderColor={"rgba(213, 213, 213, 1)"}>
            <HStack align={"stretch"} justify={"stretch"} spacing={4} w="full">
              <VStack justify="stretch" flex={1} gap={1}>
                <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                  <Text fontSize={14} fontWeight={400}>
                    {isB3trToVot3 ? t("You'll convert") : t("You'll receive")}
                  </Text>
                </HStack>
                <HStack w="full" data-testid={"B3TR"}>
                  <HStack flex={1}>
                    <B3TRIcon boxSize={["30px", "36px"]} />
                    {amountInput}
                  </HStack>
                  {isB3trToVot3 && Number(maxBalance) !== Number(amount) ? renderMaxButton : null}
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </motion.div>
        <motion.div layout transition={layoutTransition}>
          <VStack
            py={3}
            h="full"
            w="full"
            align="flex-start"
            spacing={12}
            borderBottomWidth={2}
            borderColor={"rgba(213, 213, 213, 1)"}>
            <HStack align={"stretch"} justify={"stretch"} spacing={4} w="full">
              <VStack justify="stretch" flex={1} gap={1}>
                <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                  <Text fontSize={14} fontWeight={400}>
                    {isB3trToVot3 ? t("You'll receive") : t("You'll convert")}
                  </Text>
                </HStack>
                <HStack w="full" data-testid={"VOT3"}>
                  <HStack flex={1}>
                    <Image
                      src="/assets/logos/vot3_logo_dark.svg"
                      boxSize={{ base: "30px", md: "36px" }}
                      alt="B3TR Icon"
                    />
                    {amountInput}
                  </HStack>
                  {!isB3trToVot3 && Number(maxBalance) !== Number(amount) ? renderMaxButton : null}
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </motion.div>
      </Stack>
    </motion.div>
  )
}
