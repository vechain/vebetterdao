import { XApp } from "@/api"
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { isValid } from "@repo/utils/AddressUtils"
import { FieldErrors, UseFormGetValues, UseFormRegister, UseFormWatch } from "react-hook-form"
import { AddressIcon } from "../AddressIcon"

export type CreateEditAppFormData = {
  name: string
  description: string
  logo: string
  banner: string
  projectUrl: string
  receiverAddress: string
}

type Props = {
  register: UseFormRegister<CreateEditAppFormData>
  errors: FieldErrors<CreateEditAppFormData>
  isEdit?: boolean
  editedApp?: XApp
  watch: UseFormWatch<CreateEditAppFormData>
}
export const CreateEditAppForm = ({ register, errors, isEdit = false, editedApp, watch }: Props) => {
  return (
    <Card>
      <CardHeader>
        <Heading size="lg">{isEdit ? `Edit App ${editedApp?.name}` : "Create a new App"}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} w="full">
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>Name</FormLabel>
            <Input
              {...register("name", {
                required: "Name is required",
              })}
            />
            {errors.name && <FormErrorMessage>{errors.name.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea
              {...register("description", {
                required: "Description is required",
                min: { value: 100, message: "Description is too short" },
              })}
            />
            {errors.description && <FormErrorMessage>{errors.description.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.projectUrl}>
            <FormLabel>Project URL</FormLabel>
            <Input
              {...register("projectUrl", {
                validate: value => {
                  if (!value) {
                    return "Project URL is required"
                  }
                  try {
                    new URL(value)
                    return true
                  } catch (e) {
                    return "Invalid URL"
                  }
                },
              })}
            />
            {errors.projectUrl && <FormErrorMessage>{errors.projectUrl.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.receiverAddress}>
            <FormLabel>Wallet address</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <AddressIcon borderRadius={"full"} boxSize={6} address={watch("receiverAddress")} />
              </InputLeftElement>
              <Input
                {...register("receiverAddress", {
                  validate: value => isValid(value) || "Invalid address",
                })}
              />
            </InputGroup>
            {errors.receiverAddress && <FormErrorMessage>{errors.receiverAddress.message}</FormErrorMessage>}
          </FormControl>
        </VStack>
      </CardBody>
      <CardFooter display={"flex"} flexDir={"column"} w="full">
        <Button colorScheme="blue" type="submit" size="lg" alignSelf={"flex-end"} borderRadius={"full"}>
          {isEdit ? "Save" : "Submit"}
        </Button>
      </CardFooter>
    </Card>
  )
}
