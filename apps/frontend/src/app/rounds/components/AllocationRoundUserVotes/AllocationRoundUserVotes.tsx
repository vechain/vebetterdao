import { useRoundXApps } from "@/api"
import { Box, Button, Card, CardBody, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react"
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
  const { data: xApps } = useRoundXApps(roundId)

  const { control, register, watch, handleSubmit } = useForm<FormData>({ defaultValues: { votes: [] } })
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "votes", // unique name for your Field Array
  })

  console.log("fields", fields)

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
      <CardBody>
        <Stack
          direction={["column", "column", "row"]}
          w="full"
          align={["center", "center", "stretch"]}
          justify="space-between"
          spacing={16}>
          <VStack flex={1} w="full" spacing={8}>
            <Box>
              <Heading size="xl">Assign voting power to dApps</Heading>
              <Text fontSize="md" color="gray.500" mt={4}>
                Distribute your voting power among your selected dApps to help them receive more B3TR allocation.
              </Text>
            </Box>
            <AppVotesBreakdown votes={watchVotes} roundId={roundId} />
          </VStack>
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}>
            <Box>
              <HStack justify={"space-between"} align="center" w="full">
                <Heading size="md">Available dApps</Heading>
                <Text fontSize="sm" fontWeight={"thin"}>
                  Voting power to distribute
                </Text>
              </HStack>
              <VStack spacing={4} mt={8}>
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
            </Box>
            <Button type="submit">Submit</Button>
          </form>
        </Stack>
      </CardBody>
    </Card>
  )
}
