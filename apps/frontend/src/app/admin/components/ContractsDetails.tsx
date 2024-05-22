import { useB3trBalance, useContractVersion, useVetBalance, useVot3Balance, useVthoBalance } from "@/api"
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
      <ContractAddressAndBalanceCard
        title="B3TR"
        address={config.b3trContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "MINTER_ROLE", "PAUSER_ROLE"]}
      />
      <ContractAddressAndBalanceCard
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
      <ContractAddressAndBalanceCard
        title="Emissions"
        address={config.emissionsContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "MINTER_ROLE", "UPGRADER_ROLE"]}
      />
      <ContractAddressAndBalanceCard
        title="GalaxyMember"
        address={config.galaxyMemberContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "UPGRADER_ROLE", "MINTER_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"]}
      />
      <ContractAddressAndBalanceCard
        title="TimeLock"
        address={config.timelockContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "Proposer", "Executor", "UPGRADER_ROLE"]}
      />
      <ContractAddressAndBalanceCard
        title="Treasury"
        address={config.treasuryContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"]}
      />
      <ContractAddressAndBalanceCard
        title="VOT3"
        address={config.vot3ContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "PAUSER_ROLE"]}
      />
      <ContractAddressAndBalanceCard
        title="VoterRewards"
        address={config.voterRewardsContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "VOTE_REGISTRAR_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"]}
      />
      <ContractAddressAndBalanceCard
        title="X2EarnApps"
        address={config.x2EarnAppsContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"]}
      />
      <ContractAddressAndBalanceCard
        title="XAllocationPool"
        address={config.xAllocationPoolContractAddress}
        roles={["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"]}
      />
      <ContractAddressAndBalanceCard
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
    </Grid>
  )
}

type ContractAddressAndBalanceCardProps = {
  title: string
  address: string
  roles: string[]
}
const ContractAddressAndBalanceCard = ({ title, address, roles }: ContractAddressAndBalanceCardProps) => {
  const { account } = useWallet()

  //Get balances
  const { data: b3trBalance, isLoading: b3trBalanceLoading } = useB3trBalance(address)
  const { data: vot3Balance, isLoading: vot3BalanceLoading } = useVot3Balance(address)
  const { data: vetBalance, isLoading: vetBalanceLoading } = useVetBalance(address)
  const { data: vthoBalance, isLoading: vthoBalanceLoading } = useVthoBalance(address)

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

          <HStack w="full" justify={"space-between"}>
            <Text fontSize="md" wordBreak={"break-word"} fontWeight={600}>
              {"Roles"}
            </Text>
          </HStack>
          <HStack w="full" justify={"space-between"}>
            <VStack align="flex-start" w={"full"}>
              {userRoles.map(role => (
                <HStack key={role.name + address} w={"full"} justify={"space-between"}>
                  <Text fontSize="sm">{role.name}</Text>
                  <Text fontSize="sm" justifyContent={"flex-end"}>
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
