import { VStack, Heading } from "@chakra-ui/react"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { abi } from "thor-devkit"
import { ProposalFormAction } from "@/store"
import { ethers } from "ethers"
import { ExecutableFunctionCard } from "@/app/proposals/new/form/functions/details/components/ExecutableFunctionCard"

// This is to reuse the same components of the form. This is a read-only version of the form
import { FormData as NewProposalFormData } from "@/app/proposals/new/form/functions/details/components/NewProposalForm"
import { useTranslation } from "react-i18next"

type Props = {
  actions: ProposalFormAction[]
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
      const _abi = new abi.Function(action.abiDefinition)
      let decoded: abi.Decoded = {}
      try {
        if (action.calldata) decoded = abi.decodeParameters(_abi.definition.inputs, `0x${action.calldata.slice(10)}`)
      } catch (e) {
        console.error("Error decoding call data", e)
      }
      return {
        ...action,
        params: action.abiDefinition.inputs.map(param => {
          return {
            name: param.name,
            type: param.type,
            value: decoded[param.name]
              ? param.requiresEthParse
                ? ethers.formatEther(decoded[param.name])
                : decoded[param.name]
              : undefined,
            requiresEthParse: param.requiresEthParse,
          }
        }),
      }
    })
    setValue("actions", formActions)
  }, [actions, setValue])

  return (
    <VStack spacing={4} align="flex-start" w="full" mt={4}>
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
