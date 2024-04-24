import {
  Card,
  CardBody,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Textarea,
  HStack,
  Button,
  Image,
  useDisclosure,
} from "@chakra-ui/react"
import { FaPlus, FaMagnifyingGlass } from "react-icons/fa6"
import { OnFunctionClickProps, SearchFeaturedFunctionsModal } from "./SearchFeaturedFunctionsModal"
import { useCallback } from "react"

export const InfoAndFunctionsPageContent = () => {
  const { isOpen: isSearchModaOpen, onOpen: openSearchModal, onClose: closeSearchModal } = useDisclosure()

  const handleAddFunction = useCallback((data: { selectedFunction: OnFunctionClickProps; calldata: string }) => {
    console.log(data)
  }, [])

  return (
    <>
      <SearchFeaturedFunctionsModal
        isOpen={isSearchModaOpen}
        onClose={closeSearchModal}
        handleAddFunction={handleAddFunction}
      />
      <Card w="full">
        <CardBody py={8}>
          <VStack spacing={8} align="flex-start">
            <Heading size="lg">Create a proposal</Heading>
            <Heading size="md">Basic information</Heading>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea placeholder="Enter a description" />
            </FormControl>
            <Heading size="md">Executable functions</Heading>
            <HStack spacing={4}>
              <Button
                size="sm"
                variant={"primarySubtle"}
                rounded="full"
                leftIcon={<FaMagnifyingGlass />}
                onClick={openSearchModal}>
                Search a function
              </Button>
              <Button size="sm" variant={"primarySubtle"} rounded="full" leftIcon={<FaPlus />}>
                Add custom function
              </Button>
              <Button
                size="sm"
                variant={"primarySubtle"}
                rounded="full"
                leftIcon={<Image src="/images/less-sparks.svg" boxSize={4} />}>
                Help me with AI
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </>
  )
}
