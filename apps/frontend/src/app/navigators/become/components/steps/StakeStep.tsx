import { Card, Field, Heading, HStack, Input, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { LuCircleAlert, LuShield } from "react-icons/lu"

import { useGetMaxStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMaxStake"
import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"
import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

export const StakeStep = () => {
  const { data, setData } = useNavigatorApplicationStore()
  const { account } = useWallet()
  const { data: minStake, isLoading: minStakeLoading } = useGetMinStake()
  const { data: maxStake, isLoading: maxStakeLoading } = useGetMaxStake()
  const { data: b3trBalance, isLoading: balanceLoading } = useGetB3trBalance(account?.address ?? "")

  const stakeNum = Number(data.stakeAmount) || 0
  const minStakeNum = minStake ? Number(minStake.scaled) : 0
  const maxStakeNum = maxStake ? Number(maxStake.scaled) : 0
  const balanceNum = b3trBalance ? Number(b3trBalance.scaled) : 0
  const isBelowMin = stakeNum > 0 && stakeNum < minStakeNum
  const isAboveMax = stakeNum > 0 && maxStakeNum > 0 && stakeNum > maxStakeNum
  const isAboveBalance = stakeNum > balanceNum

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="md">{"Stake B3TR"}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {
            "Navigators must stake B3TR tokens to register. Your stake determines how much VOT3 can be delegated to you (10:1 ratio). Staked B3TR can be withdrawn after exiting."
          }
        </Text>
      </VStack>

      <Card.Root variant="outline" borderRadius="xl">
        <Card.Body>
          <VStack gap={3} align="stretch">
            <HStack justify="space-between">
              <Text textStyle="sm" color="fg.muted">
                {"Minimum stake"}
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
                {"Maximum stake (1% of VOT3 supply)"}
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
            <HStack justify="space-between">
              <Text textStyle="sm" color="fg.muted">
                {"Your B3TR balance"}
              </Text>
              <Skeleton loading={balanceLoading}>
                <HStack gap={1}>
                  <Text textStyle="sm" fontWeight="semibold">
                    {balanceNum.toLocaleString()}
                  </Text>
                  <B3TRIcon boxSize={4} />
                </HStack>
              </Skeleton>
            </HStack>
            <HStack justify="space-between">
              <Text textStyle="sm" color="fg.muted">
                {"Max delegation capacity"}
              </Text>
              <Text textStyle="sm" fontWeight="semibold">
                {stakeNum > 0 ? (stakeNum * 10).toLocaleString() : "-"}
                {" VOT3"}
              </Text>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      <Field.Root required>
        <Field.Label>{"Stake amount (B3TR)"}</Field.Label>
        <Input
          type="number"
          placeholder={`${minStakeNum.toLocaleString()} - ${maxStakeNum.toLocaleString()}`}
          value={data.stakeAmount}
          onChange={e => setData({ stakeAmount: e.target.value })}
        />
      </Field.Root>

      {isBelowMin && (
        <HStack gap={2} color="red.500">
          <LuCircleAlert size={16} />
          <Text textStyle="sm">
            {"Stake must be at least "}
            {minStakeNum.toLocaleString()}
            {" B3TR"}
          </Text>
        </HStack>
      )}

      {isAboveMax && (
        <HStack gap={2} color="red.500">
          <LuCircleAlert size={16} />
          <Text textStyle="sm">
            {"Stake cannot exceed "}
            {maxStakeNum.toLocaleString()}
            {" B3TR (1% of VOT3 supply)"}
          </Text>
        </HStack>
      )}

      {isAboveBalance && !isAboveMax && (
        <HStack gap={2} color="red.500">
          <LuCircleAlert size={16} />
          <Text textStyle="sm">{"Insufficient B3TR balance"}</Text>
        </HStack>
      )}

      <Card.Root variant="outline" bg="blue.50" _dark={{ bg: "blue.900/20" }} borderRadius="xl">
        <Card.Body py={3}>
          <HStack gap={2}>
            <LuShield size={16} />
            <Text textStyle="xs" color="fg.muted">
              {
                "By registering, you commit to voting every round and submitting reports. Failure to do so will result in automatic slashing of 10% of your stake per infraction."
              }
            </Text>
          </HStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}
