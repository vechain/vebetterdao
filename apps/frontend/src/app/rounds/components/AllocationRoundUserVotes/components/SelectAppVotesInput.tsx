import { XApp } from "@/api"
import { UseFormRegister } from "react-hook-form"
import { FormData } from "../AllocationRoundUserVotes"
import { Box, HStack, Heading, Icon, Input } from "@chakra-ui/react"
import { FaRecycle } from "react-icons/fa6"

type Props = {
  register: UseFormRegister<FormData>
  index: number
  xApp?: XApp
  field: FormData["votes"][number]
}

export const SelectAppVotesInput = ({ register, index, xApp, field }: Props) => {
  return (
    <HStack
      w="full"
      justify={"space-between"}
      key={field.id}
      borderWidth={1}
      borderColor={"gray"}
      borderRadius={"lg"}
      py={2}
      px={4}>
      <HStack spacing={2} align="center">
        <Icon as={FaRecycle} />
        <Heading size="sm">{xApp?.name}</Heading>
      </HStack>
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
