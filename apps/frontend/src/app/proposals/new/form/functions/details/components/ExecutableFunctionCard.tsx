import { Box, Button, Card, CardBody, HStack, Heading, IconButton, Text, VStack } from "@chakra-ui/react"
import { Control, FieldArrayWithId, FieldError, FieldErrors, UseFormRegister } from "react-hook-form"
import { GenerateFunctionToCallParamsInput } from "@/components"
import { FormData } from "./NewProposalForm"
import { useTranslation } from "react-i18next"
import { FaPlus } from "react-icons/fa6"
import { FiTrash } from "react-icons/fi"

type Props = {
  field: FieldArrayWithId<FormData, "actions", "id">
  index: number
  register: UseFormRegister<FormData>
  control: Control<FormData, any>
  errors?: FieldErrors<FormData>
  isDisabled?: boolean
  onAddAnotherTransactionClick?: () => void
  onRemoveTransactionClick?: () => void
}

export const ExecutableFunctionCard: React.FC<Props> = ({
  field,
  index,
  errors,
  register,
  control,
  isDisabled = false,
  onAddAnotherTransactionClick,
  onRemoveTransactionClick,
}) => {
  const { t } = useTranslation()
  return (
    <Card w="full" variant="filled" data-testid={`executable-card-${index}-${field.contractAddress}-${field.name}`}>
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
                <Heading size="md">{field.name}</Heading>
                <Text fontSize="sm" color="gray.500">
                  {field.description}
                </Text>
              </Box>
            </HStack>
            {!!onRemoveTransactionClick && (
              <IconButton
                data-testid={`executable-card-${index}-${field.contractAddress}-${field.name}__remove-tx`}
                color={"red.500"}
                aria-label="Remove action"
                icon={<FiTrash />}
                size="md"
                onClick={onRemoveTransactionClick}
                variant={"ghost"}
                rounded="full"
              />
            )}
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
                  control={control}
                  humanizeLabels={true}
                  inputProps={{
                    bg: "white",
                    borderRadius: "lg",
                    isDisabled: isDisabled,
                  }}
                  selectProps={{
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
          {!!onAddAnotherTransactionClick && (
            <Button
              data-testid={`executable-card-${index}-${field.contractAddress}-${field.name}__add-another-tx`}
              size="sm"
              onClick={onAddAnotherTransactionClick}
              variant="primarySubtle"
              alignSelf={"flex-start"}
              rounded="full"
              leftIcon={<FaPlus />}>
              {t("Add another transaction")}
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
