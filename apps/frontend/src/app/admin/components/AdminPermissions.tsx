import { useWallet } from "@vechain/dapp-kit-react"
import { useAccountPermissions } from "@/api/contracts/account"
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

export const AdminPermissions = () => {
  const { account } = useWallet()

  const {
    isAdminOfB3tr,
    isAdminOfEmissions,
    isAdminOfXAllocationVoting,
    isAdminOfXAllocationPool,
    isAdminOfDAO,
    isAdminOfGalaxyMember,
    isAdminOfVot3,
    isAdminOfVoterRewards,
    isAdminOfTimeLock,
    isMinterOfB3tr,
    isMinterOfEmissions,
    isUpgraderOfEmissions,
    isUpgraderOfXAllocationVoting,
    isUpgraderOfXAllocationPool,
    isUpgraderOfGalaxyMember,
    isUpgraderOfVot3,
    isUpgraderOfVoterRewards,
    isUpgraderOfTimelock,
    isUpgraderOfTreasury,
    isAdminOfTreasury,
    isAdminOfX2EarnApps,
    isUpgraderOfX2EarnApps,
  } = useAccountPermissions(account ?? "")

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
                  <Th>TimeLock</Th>
                  <Th>Galaxy Member</Th>
                  <Th>Voter Rewards</Th>
                  <Th>XAllocation Voting</Th>
                  <Th>XAllocation Pool</Th>
                  <Th>X2Earn Apps</Th>
                  <Th>Treasury</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td fontWeight={"bold"}>ADMIN</Td>
                  <Td>{isAdminOfB3tr ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfVot3 ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfEmissions ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfDAO ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfTimeLock ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfGalaxyMember ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfVoterRewards ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfXAllocationVoting ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfXAllocationPool ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfX2EarnApps ? "Yes" : "No"}</Td>
                  <Td>{isAdminOfTreasury ? "Yes" : "No"}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight={"bold"}>MINTER</Td>
                  <Td>{isMinterOfB3tr ? "Yes" : "No"}</Td>
                  <Td></Td>
                  <Td>{isMinterOfEmissions ? "Yes" : "No"}</Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                </Tr>
                <Tr>
                  <Td fontWeight={"bold"}>UPGRADER</Td>
                  <Td></Td>
                  <Td>{isUpgraderOfVot3 ? "Yes" : "No"}</Td>
                  <Td>{isUpgraderOfEmissions ? "Yes" : "No"}</Td>
                  <Td></Td>
                  <Td>{isUpgraderOfTimelock ? "Yes" : "No"}</Td>
                  <Td>{isUpgraderOfGalaxyMember ? "Yes" : "No"}</Td>
                  <Td>{isUpgraderOfVoterRewards ? "Yes" : "No"}</Td>
                  <Td>{isUpgraderOfXAllocationVoting ? "Yes" : "No"}</Td>
                  <Td>{isUpgraderOfXAllocationPool ? "Yes" : "No"}</Td>
                  <Td>{isUpgraderOfX2EarnApps ? "Yes" : "No"}</Td>
                  <Td>{isUpgraderOfTreasury ? "Yes" : "No"}</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </HStack>
      </CardBody>
    </Card>
  )
}
