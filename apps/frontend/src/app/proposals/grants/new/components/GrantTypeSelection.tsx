import { VStack, Text, Grid, Card, CardBody, List, ListItem, ListIcon, useColorModeValue } from "@chakra-ui/react"
import { UilCheck } from "@iconscout/react-unicons"
import { Control, Controller } from "react-hook-form"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { useTranslation } from "react-i18next"

interface GrantTypeSelectionProps {
  control: Control<GrantFormData>
}

export const GrantTypeSelection = ({ control }: GrantTypeSelectionProps) => {
  const { t } = useTranslation()
  const notSelectedBorder = useColorModeValue("#D5D5D5", "#2D2D2F")

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
    <Controller
      name="grantType"
      control={control}
      render={({ field: { onChange, value } }) => (
        <VStack spacing={8} align="stretch" w="full">
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
            {Object.entries(grantTypes).map(([type, info]) => (
              <Card
                key={type}
                variant="filledWithBorder"
                cursor="pointer"
                borderColor={value === type ? "#004CFC" : notSelectedBorder}
                boxShadow={value === type ? "0px 0px 16px 0px rgba(0, 76, 252, 0.35)" : undefined}
                _hover={{ borderColor: "#004CFC" }}
                onClick={() => onChange(type)}>
                <CardBody>
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
        </VStack>
      )}
    />
  )
}
