import { useXApps } from "@/api"
import { Box, Button, Card, CardBody, CardHeader, Heading, Stack, VStack } from "@chakra-ui/react"
import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { SelectAppVotesInput } from "./components/SelectAppVotesInput"
import { AppVotesBreakdown } from "./components/AppVotesBreakdown"

type Props = {
  roundId: string
}

export type FormData = {
  votes: {
    id: string
    value: number
  }[]
}
export const AllocationRoundUserVotes = ({ roundId }: Props) => {
  const { data: xApps } = useXApps()

  const { control, register, watch, handleSubmit } = useForm<FormData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "votes", // unique name for your Field Array
  })

  const watchVotes = watch("votes")

  useEffect(() => {
    remove()
    xApps?.forEach(xApp => {
      append({ id: xApp.id, value: 0 })
    })
  }, [xApps, append, remove])

  const onSubmit = (data: FormData) => console.log("data", data)

  return (
    <Card w="full">
      <CardHeader>
        <Heading size="md">Your Votes</Heading>
      </CardHeader>
      <CardBody>
        <Stack direction={["column", "column", "row"]} w="full" align="center" justify="space-between" spacing={16}>
          <Box flex={1} w="full">
            <AppVotesBreakdown votes={watchVotes} />
          </Box>
          <Box flex={1} w="full">
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                {fields.map((field, index) => (
                  <SelectAppVotesInput
                    register={register}
                    field={field}
                    key={field.id}
                    index={index}
                    xApp={xApps?.[index]}
                  />
                ))}
              </VStack>
              <Button type="submit">Submit</Button>
            </form>
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
