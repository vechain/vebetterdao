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
    isAdminOfB3trBadge,
    isAdminOfVot3,
    isAdminOfVoterRewards,
    isMinterOfB3tr,
    isMinterOfEmissions,
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
