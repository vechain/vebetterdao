import { Card, Stack, Heading, StackProps, Box, Image, Text, HStack, Checkbox, RadioGroup } from "@chakra-ui/react"

export type CheckableCardProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  imageSrc?: string
  title: string
  description: string
  cardProps?: Card.RootProps
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
    <Card.Root
      data-testid={`checkable-card__${title}`}
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
      <Card.Body data-testid="checkable-card__body">
        <Stack gap={4} align={"flex-start"} {...stackProps}>
          <HStack justify={"space-between"} w="full" alignItems={"flex-start"}>
            <Image src={imageSrc} boxSize={32} alt={`Checkable card image for ${title}`} />
            {inputType === "checkbox" ? (
              <Checkbox.Root
                pointerEvents={"none"}
                size="md"
                data-testid={`checkable-card__${title}__checkbox`}
                checked={checked}
                onCheckedChange={details => onChange(!!details.checked)}
                rounded={"full"}>
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            ) : (
              <RadioGroup.Root
                colorPalette="blue"
                size="md"
                data-testid={`checkable-card__${title}__radio`}
                value={checked ? "1" : undefined}
                onValueChange={details => onChange(details.value === "1")}
                rounded={"full"}>
                <RadioGroup.Item value="1">
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                </RadioGroup.Item>
              </RadioGroup.Root>
            )}
          </HStack>
          <Box>
            <Heading size={["sm", "md"]}>{title}</Heading>
            <Text textStyle={["sm", "md"]} mt={2}>
              {description}
            </Text>
          </Box>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
