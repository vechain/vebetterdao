import { ProposalFormStoreState, useProposalFormStore } from "@/store/useProposalFormStore"
import {
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useCallback, useEffect } from "react"
import { ExecutableFunctionCard } from "./ExecutableFunctionCard"
import { useRouter } from "next/navigation"
import { FunctionParamsField } from "@/hooks"
import { useForm, useFieldArray } from "react-hook-form"
import { abi } from "thor-devkit"
import { register } from "mixpanel-browser"

export type FormData = {
  title: string
  description: string
  actions: (ProposalFormStoreState["actions"][0] & { params: Omit<FunctionParamsField, "id">[] })[]
}
export const NewProposalFormDetailsPageContent: React.FC = () => {
  const { actions, setData, title, shortDescription } = useProposalFormStore()

  const router = useRouter()

  const onContinue = useCallback(() => {
    router.push("/proposals/new/form/content")
  }, [router])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const { handleSubmit, register, control, formState, setValue } = useForm<FormData>()

  const { errors } = formState
  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "actions", // unique name for your Field Array
  })

  //parse actions from store and set them in the form, decoding calldata inf available
  useEffect(() => {
    const formActions = actions.map(action => {
      const _abi = new abi.Function(action.abiDefinition as abi.Function.Definition)
      let decoded: abi.Decoded = {}
      try {
        if (action.calldata) decoded = abi.decodeParameters(_abi.definition.inputs, `0x${action.calldata.slice(10)}`)
      } catch (e) {
        console.error("Error decoding call data", e)
      }
      return {
        ...action,
        params: _abi.definition.inputs.map(param => {
          return {
            name: param.name,
            type: param.type,
            value: decoded[param.name],
          }
        }),
      }
    })
    setValue("actions", formActions)
    setValue("title", title ?? "")
    setValue("description", shortDescription ?? "")
  }, [actions, title, shortDescription, setValue])

  const onFormSubmit = useCallback(
    (data: FormData) => {
      setData({
        title: data.title,
        shortDescription: data.description,
        actions: data.actions.map(action => {
          const _abi = new abi.Function(action.abiDefinition)
          return {
            contractAddress: action.contractAddress,
            abiDefinition: _abi.definition,
            functionName: action.functionName,
            functionDescription: action.functionDescription,
            calldata: _abi.encode(...action.params.map(param => param.value)),
          }
        }),
      })
      onContinue()
    },
    [setData, onContinue],
  )

  return (
    <Card w="full">
      <CardBody py={8}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <VStack spacing={8} align="flex-start">
            <Heading size="lg">What is your proposal about?</Heading>
            <Heading size="md">Basic information</Heading>
            <FormControl>
              <FormLabel>Proposal title</FormLabel>
              <Input
                placeholder="Enter proposal title"
                {...register("title", {
                  required: "This field is required",
                })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Proposal description</FormLabel>
              <Textarea
                placeholder="Enter proposal description"
                {...register("description", {
                  required: "This field is required",
                })}
              />
            </FormControl>
            <VStack spacing={4} align="flex-start" w="full" mt={4}>
              <Heading size="md">Executable functions</Heading>
              {fields?.map((field, index) => (
                <ExecutableFunctionCard
                  key={field.id}
                  field={field}
                  index={index}
                  register={register}
                  errors={errors}
                />
              ))}
            </VStack>
            <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
              <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
                Go back
              </Button>
              <Button rounded="full" colorScheme="primary" size="lg" type="submit">
                Continue
              </Button>
            </HStack>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}
