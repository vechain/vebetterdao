import { Box, Button, Card, HStack, Heading, IconButton, Text, VStack } from "@chakra-ui/react"
import { Control, FieldArrayWithId, FieldError, FieldErrors, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FaPlus } from "react-icons/fa6"
import { FiTrash } from "react-icons/fi"

import { GenerateFunctionToCallParamsInput } from "../../../../../../../components/GenerateFunctionToCallParamsInput/GenerateFunctionToCallParamsInput"

import { FormData } from "./NewProposalForm"

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
    <Card.Root
      w="full"
      variant="primary"
      data-testid={`executable-card-${index}-${field.contractAddress}-${field.name}`}>
      <Card.Body py={4}>
        <VStack gap={4} align="flex-start">
          <HStack justify="space-between" w="full">
            <HStack gap={4}>
              <Box p={4} bg="dark-contrast-on-card-bg" borderRadius="50%" lineHeight={0} pos="relative">
                <Text
                  pos="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  textStyle="sm"
                  color="contrast-bg-on-muted"
                  fontWeight="semibold">
                  {index + 1}
                </Text>
              </Box>
              <Box>
                <Heading size="md">{field.name}</Heading>
                <Text textStyle="sm" color="contrast-bg-strong">
                  {field.description}
                </Text>
              </Box>
            </HStack>
            {!!onRemoveTransactionClick && (
              <IconButton
                data-testid={`executable-card-${index}-${field.contractAddress}-${field.name}__remove-tx`}
                color={"red.500"}
                aria-label="Remove action"
                size="md"
                onClick={onRemoveTransactionClick}
                variant={"ghost"}
                rounded="full">
                <FiTrash />
              </IconButton>
            )}
          </HStack>
          <VStack gap={4} align="flex-start" w="full">
            {field.params.map((param, paramIndex) => {
              return (
                <GenerateFunctionToCallParamsInput
                  actionIndex={index}
                  key={`proposal-field-${field.id}-${param.name}-${param.type}`}
                  field={param}
                  index={paramIndex}
                  error={errors?.actions?.[index]?.params?.[paramIndex]?.value as FieldError}
                  register={register}
                  control={control}
                  humanizeLabels={true}
                  inputProps={{
                    bg: "dark-contrast-on-card-bg",
                    borderRadius: "lg",
                    disabled: isDisabled,
                  }}
                  selectProps={{
                    bg: "dark-contrast-on-card-bg",
                    borderRadius: "lg",
                    disabled: isDisabled,
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
              variant="ghost"
              color="actions.tertiary.default"
              alignSelf={"flex-start"}
              rounded="full">
              <FaPlus />
              {t("Add another transaction")}
            </Button>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
