import { useAccountBalance, useB3trBalance, useContractVersion, useVot3Balance } from "@/api"
import { AddressButton } from "@/components/AddressButton"
import { B3TRIcon, VETIcon, VOT3Icon, VTHOIcon } from "@/components"
import { Card, CardBody, CardHeader, Grid, HStack, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useMemo } from "react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useHasRoles } from "@/api/contracts/account"
import { useWallet } from "@vechain/dapp-kit-react"

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(2)

export const ContractsDetails = () => {
  const config = getConfig()
  return (
    <Grid w="full" gap={4} templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]}>
      <ContractDetailsCard
        title="B3TR"
        address={config.b3trContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "MINTER_ROLE", "PAUSER_ROLE"]}
      />
      <ContractDetailsCard
        title="B3TRGovernor"
        address={config.b3trGovernorAddress}
        roles={[
          "DEFAULT_ADMIN_ROLE",
          "PROPOSAL_EXECUTOR_ROLE",
          "PAUSER_ROLE",
          "GOVERNOR_FUNCTIONS_SETTINGS_ROLE",
          "CONTRACTS_ADDRESS_MANAGER_ROLE",
        ]}
      />
      <ContractDetailsCard
        title="Emissions"
        address={config.emissionsContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "MINTER_ROLE", "UPGRADER_ROLE"]}
      />
      <ContractDetailsCard
        title="GalaxyMember"
        address={config.galaxyMemberContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "UPGRADER_ROLE", "MINTER_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"]}
      />
      <ContractDetailsCard
        title="TimeLock"
        address={config.timelockContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "Proposer", "Executor", "UPGRADER_ROLE"]}
      />
      <ContractDetailsCard
        title="Treasury"
        address={config.treasuryContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"]}
      />
      <ContractDetailsCard
        title="VOT3"
        address={config.vot3ContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "PAUSER_ROLE"]}
      />
      <ContractDetailsCard
        title="VoterRewards"
        address={config.voterRewardsContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "VOTE_REGISTRAR_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"]}
      />
      <ContractDetailsCard
        title="X2EarnApps"
        address={config.x2EarnAppsContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"]}
      />
      <ContractDetailsCard
        title="XAllocationPool"
        address={config.xAllocationPoolContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"]}
      />
      <ContractDetailsCard
        title="XAllocationVoting"
        address={config.xAllocationVotingContractAddress}
        roles={[
          "DEFAULT_ADMIN_ROLE",
          "UPGRADER_ROLE",
          "GOVERNANCE_ROLE",
          "ROUND_STARTER_ROLE",
          "CONTRACTS_ADDRESS_MANAGER_ROLE",
        ]}
      />
      <ContractDetailsCard
        title="X2EarnRewardsPool"
        address={config.x2EarnRewardsPoolContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"]}
      />
    </Grid>
  )
}

type ContractDetailsCardProps = {
  title: string
  address: string
  roles: string[]
}
const ContractDetailsCard = ({ title, address, roles }: ContractDetailsCardProps) => {
  const { account } = useWallet()

  //Get balances
  const { data: b3trBalance, isLoading: b3trBalanceLoading } = useB3trBalance(address)
  const { data: vot3Balance, isLoading: vot3BalanceLoading } = useVot3Balance(address)
  const { data: accountBalance, isLoading: accountBalanceLoading } = useAccountBalance(address)

  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance])

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance])

  const vetBalanceScaled = useMemo(() => {
    return accountBalance?.balance.scaled ?? "0"
  }, [accountBalance])

  const vthoBalanceScaled = useMemo(() => {
    return accountBalance?.energy.scaled ?? "0"
  }, [accountBalance])

  // Get contract version
  const { data: version } = useContractVersion(address)

  // Get user roles
  const userHasRoles = useHasRoles(roles, address, account ?? "")
  // iterate over the roles and get the data
  const userRoles = userHasRoles.map((role, index) => ({
    hasRole: role.data,
    name: roles[index],
  }))

  return (
    <Card w="full" borderRadius={"2xl"} p={2}>
      <CardHeader>
        <Heading size={"sm"}>{title}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4}>
          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              {"Address"}
            </Text>
            <AddressButton address={address} size={"sm"} />
          </HStack>

          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              {"Version"}
            </Text>
            <Skeleton isLoaded={!!version}>
              <Text fontSize="md">{version}</Text>
            </Skeleton>
          </HStack>

          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              {"Balance"}
            </Text>
          </HStack>
          <HStack w="full" justify={"space-between"}>
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
              <Skeleton isLoaded={!accountBalanceLoading}>
                <Text fontSize="md"> {compactFormatter.format(Number(vetBalanceScaled))}</Text>
              </Skeleton>
              <VETIcon boxSize={5} />
            </HStack>
            <HStack spacing={1}>
              <Skeleton isLoaded={!accountBalanceLoading}>
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
      </CardBody>
    </Card>
  )
}
