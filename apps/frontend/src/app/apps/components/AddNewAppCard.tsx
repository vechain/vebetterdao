import { Card, CardBody, VStack, Image, Heading, Button } from "@chakra-ui/react"
import { FaPlus } from "react-icons/fa6"
import { useRouter } from "next/navigation"

export const AddNewAppCard = () => {
  const router = useRouter()

  const navigateToAppDetail = () => {
    router.push(`/apps/new`)
  }

  return (
    <Card variant={"baseWithBorder"} w="full" borderWidth={4} borderStyle={"dashed"} borderColor={"secondary.500"}>
      <CardBody>
        <VStack spacing={8} align="center" h="full" justify={"center"} mx={[16, 24, 32]} textAlign={"center"}>
          <Image src="/images/hand-plant.svg" boxSize={32} />
          <Heading size="md">Do you have a dApp to join the VeBetter DAO ecosystem?</Heading>
          <Button colorScheme="blue" onClick={navigateToAppDetail} rounded={"full"} leftIcon={<FaPlus />}>
            Apply now
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}
