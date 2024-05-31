import {
  Card,
  CardBody,
  Stack,
  Heading,
  CardProps,
  StackProps,
  Box,
  Image,
  Text,
  HStack,
  Checkbox,
  Radio,
} from "@chakra-ui/react"

export type CheckableCardProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  imageSrc?: string
  title: string
  description: string
  cardProps?: CardProps
  stackProps?: StackProps
  inputType?: "checkbox" | "radio"
}
export const CheckableCard: React.FC<CheckableCardProps> = ({
  checked,
  onChange,
  imageSrc,
  title,
  description,
  cardProps,
  stackProps,
  inputType = "radio",
}) => {
  return (
    <Card
      variant="baseWithBorder"
      rounded={"3xl"}
      borderColor={checked ? "primary.500" : "inherit"}
      _hover={{
        borderColor: "primary.200",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      _active={{
        borderColor: "primary.500",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onClick={() => onChange(!checked)}
      {...cardProps}>
      <CardBody>
        <Stack spacing={4} align={"flex-start"} {...stackProps}>
          <HStack justify={"space-between"} w="full" alignItems={"flex-start"}>
            <Image src={imageSrc} boxSize={32} alt={`Checkable card image for ${title}`} />
            {inputType === "checkbox" ? (
              <Checkbox size="lg" isChecked={checked} onChange={e => onChange(e.target.checked)} rounded={"full"} />
            ) : (
              <Radio size="lg" isChecked={checked} onChange={e => onChange(e.target.checked)} rounded={"full"} />
            )}
          </HStack>
          <Box>
            <Heading size="md">{title}</Heading>
            <Text mt={2}>{description}</Text>
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
