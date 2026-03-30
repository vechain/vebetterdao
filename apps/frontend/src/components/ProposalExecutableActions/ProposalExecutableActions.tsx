import { VStack, Heading } from "@chakra-ui/react"
import { decodeFunctionCalldata, DecodedFunctionData } from "@repo/utils/ContractUtils"
import { ethers } from "ethers"
import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ExecutableFunctionCard } from "@/app/proposals/new/form/functions/details/components/ExecutableFunctionCard"
// This is to reuse the same components of the form. This is a read-only version of the form
import { FormData as NewProposalFormData } from "@/app/proposals/new/form/functions/details/components/NewProposalForm"

import { ProposalFormAction } from "../../store/useProposalFormStore"

type Props = {
  actions: ProposalFormAction[]
}
const getParamValue = (decoded: DecodedFunctionData, paramName: string, requiresEthParse?: boolean) => {
  if (typeof decoded[paramName] === "undefined") return
  if (requiresEthParse) {
    return ethers.formatEther(decoded[paramName] as ethers.BigNumberish)
  }
  return decoded[paramName]
}
export const ProposalExecutableActions: React.FC<Props> = ({ actions }) => {
  const { t } = useTranslation()
  // This is to reuse the same components of the form. This is a read-only version of the form
  const { register, control, setValue } = useForm<NewProposalFormData>()
  const { fields } = useFieldArray({
    control,
    name: "actions",
  })
  //parse actions from store and set them in the form, decoding calldata inf available
  useEffect(() => {
    const formActions = actions.map(action => {
      let decoded: DecodedFunctionData = {}
      try {
        if (action.calldata) decoded = decodeFunctionCalldata(action.calldata, action.abiDefinition)
      } catch (e) {
        console.error("Error decoding call data", e)
      }
      return {
        ...action,
        params: action.abiDefinition.inputs.map(param => {
          const requiresEthParse = param.requiresEthParse === true

          return {
            name: param.name,
            type: param.type,
            value: getParamValue(decoded, param.name, requiresEthParse),
            requiresEthParse,
          }
        }),
      }
    })
    setValue("actions", formActions)
  }, [actions, setValue])

  return (
    <VStack gap={4} align="flex-start" w="full" mt={4}>
      <Heading size="md">{t("Executable functions")}</Heading>
      {fields?.map((field, index) => (
        <ExecutableFunctionCard
          key={field.id}
          field={field}
          index={index}
          register={register}
          control={control}
          isDisabled={true}
        />
      ))}
    </VStack>
  )
}
