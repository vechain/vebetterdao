import { useB3trBalance, useContractVersion, useVetBalance, useVot3Balance, useVthoBalance } from "@/api"
import { AddressButton } from "@/components/AddressButton"
import { B3TRIcon, VETIcon, VOT3Icon, VTHOIcon } from "@/components"
import { Card, CardBody, CardHeader, Grid, HStack, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useMemo } from "react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(4)

export const ContractsBalances = () => {
  const config = getConfig()
  return (
    <Grid w="full" gap={4} templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]}>
      <ContractAddressAndBalanceCard title="B3TR" address={config.b3trContractAddress} />
      <ContractAddressAndBalanceCard title="B3TRGovernor" address={config.b3trGovernorAddress} />
      <ContractAddressAndBalanceCard title="Emissions" address={config.emissionsContractAddress} />
      <ContractAddressAndBalanceCard title="GalaxyMember" address={config.galaxyMemberContractAddress} />
      <ContractAddressAndBalanceCard title="TimeLock" address={config.timelockContractAddress} />
      <ContractAddressAndBalanceCard title="Treasury" address={config.treasuryContractAddress} />
      <ContractAddressAndBalanceCard title="VOT3" address={config.vot3ContractAddress} />
      <ContractAddressAndBalanceCard title="VoterRewards" address={config.voterRewardsContractAddress} />
      <ContractAddressAndBalanceCard title="X2EarnApps" address={config.x2EarnAppsContractAddress} />
      <ContractAddressAndBalanceCard title="XAllocationPool" address={config.xAllocationPoolContractAddress} />
      <ContractAddressAndBalanceCard title="XAllocationVoting" address={config.xAllocationVotingContractAddress} />
    </Grid>
  )
}

type ContractAddressAndBalanceCardProps = {
  title: string
  address: string
}
const ContractAddressAndBalanceCard = ({ title, address }: ContractAddressAndBalanceCardProps) => {
  const { data: b3trBalance, isLoading: b3trBalanceLoading } = useB3trBalance(address)
  const { data: vot3Balance, isLoading: vot3BalanceLoading } = useVot3Balance(address)
  const { data: vetBalance, isLoading: vetBalanceLoading } = useVetBalance(address)
  const { data: vthoBalance, isLoading: vthoBalanceLoading } = useVthoBalance(address)

  const { data: version } = useContractVersion(address)

  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance])

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance])

  const vetBalanceScaled = useMemo(() => {
    return vetBalance?.scaled ?? "0"
  }, [vetBalance])

  const vthoBalanceScaled = useMemo(() => {
    return vthoBalance?.scaled ?? "0"
  }, [vthoBalance])

  return (
    <Card w="full" borderRadius={"2xl"} p={2}>
      <CardHeader>
        <Heading size={"sm"}>{title}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4}>
          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              Address
            </Text>
            <AddressButton address={address} />
          </HStack>

          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              Version
            </Text>
            <Skeleton isLoaded={!!version}>
              <Text fontSize="md">{version}</Text>
            </Skeleton>
          </HStack>

          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              Balance
            </Text>
            <HStack spacing={1}>
              <Skeleton isLoaded={!b3trBalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(b3trBalanceScaled))}</Text>
              </Skeleton>
              <B3TRIcon boxSize={5} />
            </HStack>
            <HStack spacing={1}>
              <Skeleton isLoaded={!vot3BalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(vot3BalanceScaled))}</Text>
              </Skeleton>
              <VOT3Icon boxSize={5} />
            </HStack>
            <HStack spacing={1}>
              <Skeleton isLoaded={!vetBalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(vetBalanceScaled))}</Text>
              </Skeleton>
              <VETIcon boxSize={5} />
            </HStack>
            <HStack spacing={1}>
              <Skeleton isLoaded={!vthoBalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(vthoBalanceScaled))}</Text>
              </Skeleton>
              <VTHOIcon boxSize={5} />
            </HStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
