import { useContractVersion } from "@/api"
import { AddressButton } from "@/components/AddressButton"
import { B3TRIcon, VETIcon, VOT3Icon, VTHOIcon } from "@/components"
import { Card, Grid, HStack, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useMemo } from "react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useHasRoles } from "@/api/contracts/account"
import { useWallet, useAccountBalance } from "@vechain/vechain-kit"
import { getContractByAddress } from "@/constants"
import { useGetB3trBalance, useGetVot3Balance } from "@/hooks"

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(2)

export const ContractsDetails = () => {
  const config = getConfig()
  return (
    <Grid w="full" gap={4} templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]}>
      <ContractDetailsCard
        title="B3TR"
        address={config.b3trContractAddress}
        roles={getContractByAddress(config.b3trContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="B3TRGovernor"
        address={config.b3trGovernorAddress}
        roles={getContractByAddress(config.b3trGovernorAddress)?.roles}
      />
      <ContractDetailsCard
        title="Emissions"
        address={config.emissionsContractAddress}
        roles={getContractByAddress(config.emissionsContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="GalaxyMember"
        address={config.galaxyMemberContractAddress}
        roles={getContractByAddress(config.galaxyMemberContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="TimeLock"
        address={config.timelockContractAddress}
        roles={getContractByAddress(config.timelockContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="Treasury"
        address={config.treasuryContractAddress}
        roles={getContractByAddress(config.treasuryContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="VOT3"
        address={config.vot3ContractAddress}
        roles={getContractByAddress(config.vot3ContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="VoterRewards"
        address={config.voterRewardsContractAddress}
        roles={getContractByAddress(config.voterRewardsContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="X2EarnApps"
        address={config.x2EarnAppsContractAddress}
        roles={getContractByAddress(config.x2EarnAppsContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="XAllocationPool"
        address={config.xAllocationPoolContractAddress}
        roles={getContractByAddress(config.xAllocationPoolContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="XAllocationVoting"
        address={config.xAllocationVotingContractAddress}
        roles={getContractByAddress(config.xAllocationVotingContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="X2EarnRewardsPool"
        address={config.x2EarnRewardsPoolContractAddress}
        roles={getContractByAddress(config.x2EarnRewardsPoolContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="VeBetterPassport"
        address={config.veBetterPassportContractAddress}
        roles={getContractByAddress(config.veBetterPassportContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="X2EarnCreator"
        address={config.x2EarnCreatorContractAddress}
        roles={getContractByAddress(config.x2EarnCreatorContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="NodeManagement"
        address={config.nodeManagementContractAddress}
        roles={getContractByAddress(config.nodeManagementContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="Grants Manager"
        address={config.grantsManagerContractAddress}
        roles={getContractByAddress(config.grantsManagerContractAddress)?.roles}
      />
      <ContractDetailsCard
        title="Stargate"
        address={config.stargateNFTContractAddress}
        roles={getContractByAddress(config.stargateNFTContractAddress)?.roles}
      />
    </Grid>
  )
}

type ContractDetailsCardProps = {
  title: string
  address: string
  roles?: string[]
}
const ContractDetailsCard = ({ title, address, roles = [] }: ContractDetailsCardProps) => {
  const { account } = useWallet()

  //Get balances
  const { data: b3trBalance, isLoading: b3trBalanceLoading } = useGetB3trBalance(address)
  const { data: vot3Balance, isLoading: vot3BalanceLoading } = useGetVot3Balance(address)
  const { data: accountBalance, isLoading: accountBalanceLoading } = useAccountBalance(address)

  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance])

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance])

  const vetBalanceScaled = accountBalance?.balance ?? "0"
  const vthoBalanceScaled = accountBalance?.energy ?? "0"

  // Get contract version
  const { data: version } = useContractVersion(address)

  // Get user roles
  const userHasRoles = useHasRoles(roles, address, account?.address ?? "")
  // iterate over the roles and get the data
  const userRoles = roles.map((role, index) => ({
    hasRole: userHasRoles.data?.[index] ?? false,
    name: role,
  }))

  return (
    <Card.Root w="full" borderRadius={"2xl"} p={2}>
      <Card.Header>
        <Heading size={"md"}>{title}</Heading>
      </Card.Header>
      <Card.Body>
        <VStack gap={4}>
          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              {"Address"}
            </Text>
            <AddressButton address={address} size={"sm"} showAddressIcon={false} />
          </HStack>

          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              {"Version"}
            </Text>
            <Skeleton loading={!version}>
              <Text fontSize="md">{version}</Text>
            </Skeleton>
          </HStack>

          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              {"Balance"}
            </Text>
          </HStack>
          <HStack w="full" justify={"space-between"}>
            <HStack gap={1}>
              <Skeleton loading={b3trBalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(b3trBalanceScaled))}</Text>
              </Skeleton>
              <B3TRIcon boxSize={5} />
            </HStack>
            <HStack gap={1}>
              <Skeleton loading={vot3BalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(vot3BalanceScaled))}</Text>
              </Skeleton>
              <VOT3Icon boxSize={5} />
            </HStack>
            <HStack gap={1}>
              <Skeleton loading={accountBalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(vetBalanceScaled))}</Text>
              </Skeleton>
              <VETIcon boxSize={5} />
            </HStack>
            <HStack gap={1}>
              <Skeleton loading={accountBalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(vthoBalanceScaled))}</Text>
              </Skeleton>
              <VTHOIcon boxSize={5} />
            </HStack>
          </HStack>

          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              {"Roles"}
            </Text>
          </HStack>
          <HStack w="full" justify={"space-between"}>
            <VStack align="flex-start" w={"full"}>
              {userRoles.map(role => (
                <HStack key={role.name + address} w={"full"} justify={"space-between"}>
                  <Text fontSize="xs">{role.name}</Text>
                  <Text fontSize="xs" justifyContent={"flex-end"}>
                    {role.hasRole ? "✅" : "❌"}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
