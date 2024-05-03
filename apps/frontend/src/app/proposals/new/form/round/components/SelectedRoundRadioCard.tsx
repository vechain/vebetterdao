import { Card, VStack, HStack, Heading, Radio, Box } from "@chakra-ui/react"

type Props = {
  roundId: number
  selected: boolean
  onSelect: () => void
}
export const SelectedRoundRadioCard: React.FC<Props> = ({ roundId, selected, onSelect }) => {
  return (
    <Card
      w="full"
      onClick={onSelect}
      cursor="pointer"
      borderWidth={1}
      borderColor={selected ? "primary.active" : "gray.200"}
      borderRadius="xl"
      {...(selected && {
        boxShadow: "0px 0px 16px 0px rgba(0, 76, 252, 0.35)",
      })}
      p={6}
      _hover={{ borderColor: "primary.active", transition: "border-color 0.2s" }}>
      <VStack spacing={4} align="flex-start">
        <HStack justify="space-between" w="full">
          <Box>
            <Heading size="md">Round #{roundId}</Heading>
            {/* <Text fontSize="lg" fontWeight="600">
            {round.date}
          </Text> */}
          </Box>
          <Radio isChecked={selected} />
        </HStack>
      </VStack>
    </Card>
  )
}
