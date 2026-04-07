import { Button, Separator, Field, Heading, HStack, Icon, NumberInput, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { WarningTriangle } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { useGetMaxStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMaxStake"
import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"
import { handleAmountInput } from "@/components/PowerUpModal/utils"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"
import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

export const StakeStep = () => {
  const { t } = useTranslation()
  const { data, setData } = useNavigatorApplicationStore()
  const { account } = useWallet()
  const { data: minStake, isLoading: minStakeLoading } = useGetMinStake()
  const { data: maxStake, isLoading: maxStakeLoading } = useGetMaxStake()
  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? "")

  const stakeNum = Number(data.stakeAmount) || 0
  const minStakeNum = minStake ? Number(minStake.scaled) : 0
  const maxStakeNum = maxStake ? Number(maxStake.scaled) : 0
  const availableBalance = b3trBalance?.scaled ?? "0"
  const balanceNum = Number(availableBalance)

  const isBelowMin = stakeNum > 0 && stakeNum < minStakeNum
  const isAboveMax = stakeNum > 0 && maxStakeNum > 0 && stakeNum > maxStakeNum
  const isAboveBalance = stakeNum > balanceNum

  const effectiveMax = maxStakeNum > 0 ? Math.min(balanceNum, maxStakeNum) : balanceNum
  const handleUseMax = () => setData({ stakeAmount: handleAmountInput(String(effectiveMax)) })

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="md">{t("Stake B3TR")}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {t(
            "Navigators must stake B3TR tokens to register. Your stake determines how much VOT3 can be delegated to you (10:1 ratio). Staked B3TR can be withdrawn after exiting.",
          )}
        </Text>
      </VStack>

      <HStack justify="space-between">
        <Text textStyle="sm" color="fg.muted">
          {t("Minimum stake")}
        </Text>
        <Skeleton loading={minStakeLoading}>
          <HStack gap={1}>
            <Text textStyle="sm" fontWeight="semibold">
              {minStakeNum.toLocaleString()}
            </Text>
            <B3TRIcon boxSize={4} />
          </HStack>
        </Skeleton>
      </HStack>

      <HStack justify="space-between">
        <Text textStyle="sm" color="fg.muted">
          {t("Maximum stake (1% of VOT3 supply)")}
        </Text>
        <Skeleton loading={maxStakeLoading}>
          <HStack gap={1}>
            <Text textStyle="sm" fontWeight="semibold">
              {maxStakeNum.toLocaleString()}
            </Text>
            <B3TRIcon boxSize={4} />
          </HStack>
        </Skeleton>
      </HStack>

      <VStack
        bg="card.default"
        border="1px solid"
        borderColor="border.secondary"
        borderRadius="2xl"
        p={4}
        gap={0}
        align="start"
        w="full">
        <Field.Root gap={2} required invalid={isAboveBalance || isAboveMax || isBelowMin}>
          <Field.Label w="full" alignItems="center" justifyContent="space-between">
            <Text textStyle="sm" color="text.subtle">
              {t("Stake amount")}
            </Text>
            <Button variant="link" height="5" size="sm" p="0" onClick={handleUseMax}>
              {t("Use max")}
            </Button>
          </Field.Label>

          <HStack w="full" justifyContent="space-between">
            <VStack align="start" gap="2" w="full">
              <NumberInput.Root asChild textOverflow="ellipsis" p="0" allowOverflow={false} min={0}>
                <NumberInput.Input
                  min={0}
                  p="0"
                  value={data.stakeAmount}
                  placeholder="0"
                  onChange={e => setData({ stakeAmount: handleAmountInput(e.target.value) })}
                  onBlur={() => setData({ stakeAmount: data.stakeAmount.replace(/\.$/, "") })}
                  border="none"
                  outline="none"
                  textStyle={
                    (data.stakeAmount || "0").length > 15 ? "lg" : (data.stakeAmount || "0").length > 10 ? "xl" : "3xl"
                  }
                  transition="font-size 0.15s ease-out"
                />
              </NumberInput.Root>
              {isAboveBalance && !isAboveMax && (
                <Field.ErrorText>
                  <Icon as={WarningTriangle} boxSize="4" />
                  {t("Insufficient B3TR balance")}
                </Field.ErrorText>
              )}
              {isAboveMax && (
                <Field.ErrorText>
                  <Icon as={WarningTriangle} boxSize="4" />
                  {t("Exceeds maximum stake (1% of VOT3 supply)")}
                </Field.ErrorText>
              )}
              {isBelowMin && (
                <Field.ErrorText>
                  <Icon as={WarningTriangle} boxSize="4" />
                  {t("Minimum stake is {{amount}} B3TR", {
                    amount: minStakeNum.toLocaleString(),
                  })}
                </Field.ErrorText>
              )}
            </VStack>

            <VStack align="end" gap={2} flexShrink={0}>
              <HStack gap={2}>
                <B3TRIcon boxSize="24px" />
                <Text textStyle="lg" fontWeight="semibold">
                  {t("B3TR")}
                </Text>
              </HStack>
              <Text textStyle="xs" color="text.subtle">
                {t("Available: {{amount}}", {
                  amount: Number(availableBalance).toLocaleString(),
                })}
              </Text>
            </VStack>
          </HStack>
        </Field.Root>

        <Separator my={3} w="full" />

        <HStack justify="space-between">
          <Text textStyle="sm" color="text.subtle">
            {t("Will result in a max delegation capacity of")}
          </Text>
          <HStack gap={2}>
            <Text textStyle="sm" fontWeight="semibold">
              {stakeNum > 0 ? (stakeNum * 10).toLocaleString() : "-"}
            </Text>
            <VOT3Icon boxSize="18px" />
          </HStack>
        </HStack>
      </VStack>
    </VStack>
  )
}
