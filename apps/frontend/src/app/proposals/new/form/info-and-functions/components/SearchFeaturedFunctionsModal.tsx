import { CustomModalContent } from "@/components/CustomModalContent"
import { GovernanceFeaturedContractsWithFunctions } from "@/constants"
import {
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  Heading,
  VStack,
  Box,
  Text,
  Divider,
} from "@chakra-ui/react"
import { useState } from "react"

type Props = {
  isOpen: boolean
  onClose: () => void
}
export const SearchFeaturedFunctionsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Heading size="md">Search Featured Functions</Heading>
        </ModalHeader>
        <ModalBody>
          <SearchFeaturedFunctionsForm />
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}

const SearchFeaturedFunctionsForm = () => {
  const [searchValue, setSearchValue] = useState("")

  return (
    <VStack spacing={8} w="full">
      {GovernanceFeaturedContractsWithFunctions.map((contract, index) => (
        <VStack key={index} spacing={4} align="flex-start" w="full">
          <Box>
            <Heading size="sm">{contract.name}</Heading>
            <Text fontSize="sm" fontWeight={400} color={"gray.500"}>
              {contract.description}
            </Text>
          </Box>
          <VStack spacing={4} align="flex-start" divider={<Divider />} w="full">
            {contract.functions.map((func, index) => (
              <Box key={index}>
                <Text as="samp" fontSize="sm" fontWeight={500} color={"primary.500"}>
                  {func.name}
                </Text>
                <Text fontSize="sm" fontWeight={400} color={"gray.500"}>
                  {func.description}
                </Text>
              </Box>
            ))}
          </VStack>
        </VStack>
      ))}
    </VStack>
  )
}
