import {
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { isValid } from "@repo/utils/AddressUtils"
import { FieldErrors, UseFormRegister } from "react-hook-form"

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
}
export const CreateEditAppForm = ({ register, errors, isEdit = false }: Props) => {
  return (
    <Card>
      <CardHeader>
        <Heading size="lg">{isEdit ? "Edit App" : "Create a new App"}</Heading>
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
                validate: value => !!new URL(value) || "Invalid URL",
              })}
            />
            {errors.projectUrl && <FormErrorMessage>{errors.projectUrl.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.receiverAddress}>
            <FormLabel>Wallet address</FormLabel>
            <Input
              {...register("receiverAddress", {
                validate: value => isValid(value) || "Invalid address",
              })}
            />
            {errors.receiverAddress && <FormErrorMessage>{errors.receiverAddress.message}</FormErrorMessage>}
          </FormControl>
        </VStack>
      </CardBody>
    </Card>
  )
}
