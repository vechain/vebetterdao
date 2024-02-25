import { useWallet } from "@vechain/dapp-kit-react"
import { ADMIN_ROLE, MINTER_ROLE, useHasRole } from "@/api/contracts/account"
import {
  HStack,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Card,
  CardBody,
  Heading,
  CardHeader,
} from "@chakra-ui/react"
import { getConfig } from "@repo/config"

const config = getConfig()

export const AdminPermissions = () => {
  const { account } = useWallet()

  const { data: isAdminOfB3tr } = useHasRole(ADMIN_ROLE, config.b3trContractAddress, account ?? undefined)
  const { data: isAdminOfEmissions } = useHasRole(ADMIN_ROLE, config.emissionsContractAddress, account ?? undefined)
  const { data: isAdminOfXAllocationVoting } = useHasRole(
    ADMIN_ROLE,
    config.xAllocationVotingContractAddress,
    account ?? undefined,
  )
  const { data: isAdminOfXAllocationPool } = useHasRole(
    ADMIN_ROLE,
    config.xAllocationPoolContractAddress,
    account ?? undefined,
  )
  const { data: isAdminOfDAO } = useHasRole(ADMIN_ROLE, config.b3trGovernorAddress, account ?? undefined)
  const { data: isAdminOfB3trBadge } = useHasRole(ADMIN_ROLE, config.nftBadgeContractAddress, account ?? undefined)
  const { data: isAdminOfVot3 } = useHasRole(ADMIN_ROLE, config.vot3ContractAddress, account ?? undefined)
  const { data: isAdminOfVoterRewards } = useHasRole(
    ADMIN_ROLE,
    config.voterRewardsContractAddress,
    account ?? undefined,
  )

  const { data: isMinterOfB3tr } = useHasRole(MINTER_ROLE, config.b3trContractAddress, account ?? undefined)
  const { data: isMinterOfEmissions } = useHasRole(MINTER_ROLE, config.emissionsContractAddress, account ?? undefined)

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">Permissions</Heading>
      </CardHeader>
      <CardBody>
        <HStack>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th></Th>
                  <Th>B3TR</Th>
                  <Th>VOT3</Th>
                  <Th>Emissions</Th>
                  <Th>DAO</Th>
                  <Th>B3TR Badge</Th>
                  <Th>Voter Rewards</Th>
                  <Th>XAllocation Voting</Th>
                  <Th>XAllocation Pool</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td fontWeight={"bold"}>ADMIN</Td>
                  <Td>{isAdminOfB3tr ? "Yes" : "-"}</Td>
                  <Td>{isAdminOfVot3 ? "Yes" : "-"}</Td>
                  <Td>{isAdminOfEmissions ? "Yes" : "-"}</Td>
                  <Td>{isAdminOfDAO ? "Yes" : "-"}</Td>
                  <Td>{isAdminOfB3trBadge ? "Yes" : "-"}</Td>
                  <Td>{isAdminOfVoterRewards ? "Yes" : "-"}</Td>
                  <Td>{isAdminOfXAllocationVoting ? "Yes" : "-"}</Td>
                  <Td>{isAdminOfXAllocationPool ? "Yes" : "-"}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight={"bold"}>MINTER</Td>
                  <Td>{isMinterOfB3tr ? "Yes" : "-"}</Td>
                  <Td></Td>
                  <Td>{isMinterOfEmissions ? "Yes" : "-"}</Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </HStack>
      </CardBody>
    </Card>
  )
}
