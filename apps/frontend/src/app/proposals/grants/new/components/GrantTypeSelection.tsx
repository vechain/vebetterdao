import { VStack, Text, Grid, Card, CardBody, RadioGroup, Radio, List, ListItem, ListIcon } from "@chakra-ui/react"
import { UilCheck } from "@iconscout/react-unicons"
import { UseFormRegister } from "react-hook-form"
import { GrantFormData } from "./GrantsNewPageContent"
import { useTranslation } from "react-i18next"

interface GrantTypeSelectionProps {
  register: UseFormRegister<GrantFormData>
  value: string
}

export const GrantTypeSelection = ({ register, value }: GrantTypeSelectionProps) => {
  const { t } = useTranslation()

  const grantTypes = {
    dapp: {
      title: t("dApp grant"),
      amount: "30K USD",
      duration: "For 12 months execution",
      description: "Who it's for",
      target:
        "Builders creating sustainability-focused, applications that incentivise user actions with measurable impact.",
      requirements: [
        "X2Earn (e.g. Recycle2Earn, Move2Earn, etc.)",
        "Apps that directly track and reward sustainable behaviour.",
        "Projects with clear, measurable environmental or social outcomes.",
      ],
    },
    tooling: {
      title: t("Tooling grant"),
      amount: "50K USD",
      duration: "For 12 months execution",
      description: "Who it's for",
      target: "Developers working on the infrastructure and tools that empower the VeBetterDAO ecosystem.",
      requirements: [
        "Developer SDKs or APIs",
        "Protocol upgrades or modules",
        "DAO governance tooling",
        "Backend infrastructure to support dApps",
      ],
    },
  }

  return (
    <VStack spacing={8} align="stretch" w="full">
      <RadioGroup value={value}>
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {Object.entries(grantTypes).map(([type, info]) => (
            <Card
              key={type}
              variant="outline"
              cursor="pointer"
              borderColor={value === type ? "#004CFC" : "gray.200"}
              _hover={{ borderColor: "#004CFC" }}>
              <CardBody>
                <Radio {...register("grantType")} value={type} w="0" h="0" position="absolute" opacity="0" />
                <VStack align="flex-start" spacing={4}>
                  <Text fontSize="xl" fontWeight="bold">
                    {info.title}
                  </Text>
                  <VStack w="full" justify="space-between" align="flex-start">
                    <Text fontSize="2xl" fontWeight="bold" color="#004CFC">
                      {t("Up to {{amount}}", { amount: info.amount })}
                    </Text>
                    <Text color="gray.600">{info.duration}</Text>
                  </VStack>
                  <Text fontSize="lg" fontWeight="semibold">
                    {info.description}
                  </Text>
                  <Text color="gray.600">{info.target}</Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {t("Apply if you are building")}
                  </Text>
                  <List spacing={2}>
                    {info.requirements.map((req, index) => (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={UilCheck} color="#004CFC" />
                        <Text color="gray.600">{req}</Text>
                      </ListItem>
                    ))}
                  </List>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </RadioGroup>
    </VStack>
  )
}
