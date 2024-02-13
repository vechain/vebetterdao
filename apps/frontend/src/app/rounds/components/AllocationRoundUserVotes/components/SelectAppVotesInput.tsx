import { XApp } from "@/api"
import { UseFormRegister } from "react-hook-form"
import { FormData } from "../AllocationRoundUserVotes"
import { Box, HStack, Heading, Input } from "@chakra-ui/react"

type Props = {
  register: UseFormRegister<FormData>
  index: number
  xApp?: XApp
  field: FormData["votes"][number]
}

export const SelectAppVotesInput = ({ register, index, xApp, field }: Props) => {
  return (
    <HStack w="full" justify={"space-between"} key={field.id}>
      <Heading size="sm">{xApp?.name}</Heading>
      <Box>
        <Input
          type="number"
          {...register(`votes.${index}.value`, {
            valueAsNumber: true,
          })}
          defaultValue={0}
          min={0}
          max={100}
          w="full"
        />
      </Box>
    </HStack>
  )
}
