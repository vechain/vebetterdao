import { Box, Card, CardBody, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { FieldArrayWithId, FieldError, FieldErrors, UseFormRegister } from "react-hook-form"
import { GenerateFunctionToCallParamsInput } from "@/components"
import { FormData } from "./NewProposalForm"

type Props = {
  field: FieldArrayWithId<FormData, "actions", "id">
  index: number
  register: UseFormRegister<FormData>
  errors?: FieldErrors<FormData>
  isDisabled?: boolean
}

export const ExecutableFunctionCard: React.FC<Props> = ({ field, index, errors, register, isDisabled = false }) => {
  return (
    <Card w="full" variant="filled">
      <CardBody py={4}>
        <VStack spacing={4} align="flex-start">
          <HStack justify="space-between" w="full">
            <HStack spacing={4}>
              <Box p={4} bg="gray.100" borderRadius="50%" lineHeight={0} pos="relative">
                <Text
                  pos="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  fontSize="sm"
                  fontWeight={600}>
                  {index + 1}
                </Text>
              </Box>
              <Box>
                <Heading size="md">{field.functionName}</Heading>
                <Text fontSize="sm" color="gray.500">
                  {field.functionDescription}
                </Text>
              </Box>
            </HStack>
          </HStack>
          <VStack spacing={4} align="flex-start" w="full">
            {field.params.map((param, paramIndex) => {
              return (
                <GenerateFunctionToCallParamsInput
                  actionIndex={index}
                  key={paramIndex}
                  field={param}
                  index={paramIndex}
                  error={errors?.actions?.[index]?.params?.[paramIndex]?.value as FieldError}
                  register={register}
                  humanizeLabels={true}
                  inputProps={{
                    bg: "white",
                    borderRadius: "lg",
                    isDisabled: isDisabled,
                  }}
                  formLabelProps={{
                    fontWeight: 600,
                  }}
                />
              )
            })}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
