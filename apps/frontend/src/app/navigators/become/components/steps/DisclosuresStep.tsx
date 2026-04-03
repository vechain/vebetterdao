import { Field, Heading, HStack, Input, Switch, Text, Textarea, VStack } from "@chakra-ui/react"

import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

const ToggleField = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => (
  <HStack justify="space-between" w="full">
    <Text textStyle="sm">{label}</Text>
    <Switch.Root checked={checked} onCheckedChange={e => onCheckedChange(e.checked)} colorPalette="blue" size="sm">
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Root>
  </HStack>
)

export const DisclosuresStep = () => {
  const { data, setData } = useNavigatorApplicationStore()

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="md">{"Disclosures"}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {
            "Transparency is key. Citizens should know about any potential conflicts of interest before delegating to you. All disclosures are public."
          }
        </Text>
      </VStack>

      <VStack gap={2} align="stretch">
        <ToggleField
          label="Are you affiliated with any VeBetterDAO app?"
          checked={data.isAppAffiliated}
          onCheckedChange={checked => setData({ isAppAffiliated: checked })}
        />
        {data.isAppAffiliated && (
          <Field.Root>
            <Field.Label>{"App names"}</Field.Label>
            <Input
              placeholder="e.g. Mugshot, GreenCart"
              value={data.affiliatedAppNames}
              onChange={e => setData({ affiliatedAppNames: e.target.value })}
              size="sm"
            />
            <Field.HelperText>{"List the apps you are affiliated with"}</Field.HelperText>
          </Field.Root>
        )}
      </VStack>

      <VStack gap={2} align="stretch">
        <ToggleField
          label="Are you a VeChain Foundation member or employee?"
          checked={data.isFoundationMember}
          onCheckedChange={checked => setData({ isFoundationMember: checked })}
        />
        {data.isFoundationMember && (
          <Field.Root>
            <Field.Label>{"Role"}</Field.Label>
            <Input
              placeholder="e.g. Developer Relations"
              value={data.foundationRole}
              onChange={e => setData({ foundationRole: e.target.value })}
              size="sm"
            />
            <Field.HelperText>{"What is your role at the foundation?"}</Field.HelperText>
          </Field.Root>
        )}
      </VStack>

      <VStack gap={2} align="stretch">
        <ToggleField
          label="Do you have any other conflicts of interest to disclose?"
          checked={data.hasConflictsOfInterest}
          onCheckedChange={checked => setData({ hasConflictsOfInterest: checked })}
        />
        {data.hasConflictsOfInterest && (
          <Field.Root>
            <Field.Label>{"Description"}</Field.Label>
            <Textarea
              placeholder="Describe any conflicts..."
              value={data.conflictsDescription}
              onChange={e => setData({ conflictsDescription: e.target.value })}
              rows={3}
              maxLength={500}
              size="sm"
            />
          </Field.Root>
        )}
      </VStack>

      <Field.Root>
        <Field.Label>{"Previous DAO experience"}</Field.Label>
        <Textarea
          placeholder="e.g. I was a delegate in Optimism governance..."
          value={data.previousDaoExperience}
          onChange={e => setData({ previousDaoExperience: e.target.value })}
          rows={3}
          maxLength={500}
          size="sm"
        />
        <Field.HelperText>{"Have you participated in governance in other DAOs?"}</Field.HelperText>
      </Field.Root>
    </VStack>
  )
}
