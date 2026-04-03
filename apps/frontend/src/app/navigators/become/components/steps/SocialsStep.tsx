import { Field, Heading, Input, Text, Textarea, VStack } from "@chakra-ui/react"

import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

export const SocialsStep = () => {
  const { data, setData } = useNavigatorApplicationStore()

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="md">{"Social Profiles"}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {"Help citizens verify your identity and follow your activity. At least one social profile is recommended."}
        </Text>
      </VStack>

      <Field.Root>
        <Field.Label>{"Twitter / X"}</Field.Label>
        <Input
          placeholder="vebetterdao"
          value={data.twitterHandle}
          onChange={e => setData({ twitterHandle: e.target.value })}
        />
        <Field.HelperText>{"Your Twitter handle (without @)"}</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>{"Discord"}</Field.Label>
        <Input
          placeholder="username#1234"
          value={data.discordHandle}
          onChange={e => setData({ discordHandle: e.target.value })}
        />
        <Field.HelperText>{"Your Discord username"}</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>{"Website"}</Field.Label>
        <Input
          placeholder="https://mywebsite.com"
          value={data.websiteUrl}
          onChange={e => setData({ websiteUrl: e.target.value })}
        />
        <Field.HelperText>{"Personal website or blog"}</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>{"Other links"}</Field.Label>
        <Textarea
          placeholder={"https://github.com/myuser\nhttps://linkedin.com/in/myprofile"}
          value={data.otherLinks}
          onChange={e => setData({ otherLinks: e.target.value })}
          rows={3}
        />
        <Field.HelperText>{"GitHub, LinkedIn, forum profile, etc."}</Field.HelperText>
      </Field.Root>
    </VStack>
  )
}
