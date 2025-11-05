import { Box, Button, Card, Dialog, Grid, GridItem, Heading, Icon, Square, Text, VStack } from "@chakra-ui/react"
import { Clock, Flash } from "iconoir-react"

import { B3TRIcon } from "@/components/Icons/B3TRIcon"

import { AllocationTabs } from "./components/tabs/AllocationTabs"

// const getAllocation = async () =>
//   Promise.resolve({
//     name: "Mock Allocation",
//   })
//   const allocation = await getAllocation()

export default async function Page() {
  return (
    <>
      <VStack alignItems="stretch" gap="2" w="full" mb="6">
        <Heading>{"Allocation"}</Heading>
        <Grid templateRows="repeat(2,1fr)" templateColumns="repeat(2,1fr)" gap="2">
          <GridItem asChild colSpan={2} w="full">
            <Card.Root
              p="4"
              variant="subtle"
              bgColor="status.positive.subtle"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between">
              <VStack flex={1} lineClamp={2}>
                <Text textStyle="xs">{"Voting Power"}</Text>
                <Text textStyle="lg" fontWeight="semibold">
                  {"XX.XXK"}
                </Text>
              </VStack>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button variant="primary">
                    <Icon as={Flash} boxSize="4" />
                    {"Power up"}
                  </Button>
                </Dialog.Trigger>
              </Dialog.Root>
            </Card.Root>
          </GridItem>
          <GridItem asChild>
            <Card.Root
              p="4"
              variant="subtle"
              bgColor="status.info.subtle"
              display="grid"
              gridTemplateColumns="2rem 1fr"
              columnGap="2"
              alignItems="center">
              <Square rounded="md" bgColor="status.info.subtle" aspectRatio={1} height="32px">
                <Icon boxSize="5" color="status.info.strong">
                  <B3TRIcon />
                </Icon>
              </Square>
              <VStack flex={1} lineClamp={2} gap="1">
                <Text textStyle="xs" lineClamp={1}>
                  {"Potential rewards"}
                </Text>
                <Text textStyle="sm" fontWeight="semibold" lineClamp={1}>
                  {"XX.XXK B3TR"}
                </Text>
              </VStack>
            </Card.Root>
          </GridItem>
          <GridItem asChild>
            <Card.Root
              p="4"
              variant="subtle"
              bgColor="status.warning.subtle"
              display="grid"
              gridTemplateColumns="32px 1fr"
              columnGap="2"
              alignItems="center">
              <Square rounded="md" bgColor="status.warning.subtle" aspectRatio={1} height="32px">
                <Icon as={Clock} boxSize="5" color="status.warning.strong" />
              </Square>
              <VStack flex={1} lineClamp={2} gap="1">
                <Text textStyle="xs">{"Left to vote"}</Text>
                <Text textStyle="sm" fontWeight="semibold">
                  {"5d  12h 12m"}
                </Text>
              </VStack>
            </Card.Root>
            <VStack flex={1} lineClamp={2}>
              <Text textStyle="xs">{"Voting Power"}</Text>
              <Text textStyle="sm" fontWeight="semibold">
                {"XX.XXK"}
              </Text>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>

      <AllocationTabs />

      <Box
        p="4"
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="bg.primary"
        border="sm"
        borderColor="border.secondary"
        zIndex={50}>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button w="full" variant="primary">
              {"Vote for 10 apps"}
            </Button>
          </Dialog.Trigger>
        </Dialog.Root>
      </Box>
    </>
  )
}
