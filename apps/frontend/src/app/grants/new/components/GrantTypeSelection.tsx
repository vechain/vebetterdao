import { Card, CardBody, Grid, Icon, List, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { Control, Controller, UseFormSetValue } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { BsCheck } from "react-icons/bs"

import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { useColorModeValue } from "@/components/ui/color-mode"

interface GrantTypeSelectionProps {
  control: Control<GrantFormData>
  setValue: UseFormSetValue<GrantFormData>
  setData: (data: Partial<GrantFormData>) => void
}
export const GrantTypeSelection = ({ control, setValue, setData }: GrantTypeSelectionProps) => {
  const { t } = useTranslation()
  const notSelectedBorder = useColorModeValue("#D5D5D5", "#2D2D2F")
  const handleGrantTypeChange = useCallback(
    (type: string) => {
      setValue("grantType", type)
      setData({ grantType: type })
    },
    [setValue, setData],
  )
  const grantTypes = {
    dapp: {
      title: t("App grant"),
      amount: "30K USD",
      duration: "For 12 months",
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
      duration: "For 12 months",
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
      rules={{
        required: {
          value: true,
          message: t("Invalid {{fieldName}}", { fieldName: "Grant type" }),
        },
      }}
      render={({ field: { value } }) => (
        <VStack gap={8} align="stretch" w="full">
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
            {Object.entries(grantTypes).map(([type, info]) => (
              <Card.Root
                key={type}
                variant="primary"
                as="button"
                borderColor={value === type ? "actions.tertiary.default" : notSelectedBorder}
                boxShadow={value === type ? "0px 0px 16px 0px var(--vbd-colors-actions-tertiary-default)" : undefined}
                _hover={{ borderColor: "actions.tertiary.default" }}
                onClick={() => handleGrantTypeChange(type)}>
                <CardBody>
                  <VStack align="flex-start" gap={4}>
                    <Text textStyle="xl" fontWeight="bold">
                      {info.title}
                    </Text>
                    <VStack w="full" justify="space-between" align="flex-start">
                      <Text textStyle="2xl" fontWeight="bold" color="actions.tertiary.default">
                        {t("Up to {{amount}}", { amount: info.amount })}
                      </Text>
                      <Text color="gray.600">{info.duration}</Text>
                    </VStack>
                    <Text textStyle="lg" fontWeight="semibold" display={{ base: "none", md: "block" }}>
                      {info.description}
                    </Text>
                    <Text color="gray.600">{info.target}</Text>
                    <Text textStyle="lg" fontWeight="semibold" display={{ base: "none", md: "block" }}>
                      {t("Apply if you are building")}
                    </Text>
                    <List.Root gap={2} display={{ base: "none", md: "block" }}>
                      {info.requirements.map(req => (
                        <List.Item key={req} display="flex" alignItems="center">
                          <List.Indicator asChild color="actions.tertiary.default">
                            <Icon as={BsCheck} />
                          </List.Indicator>
                          <Text color="gray.600">{req}</Text>
                        </List.Item>
                      ))}
                    </List.Root>
                  </VStack>
                </CardBody>
              </Card.Root>
            ))}
          </Grid>
        </VStack>
      )}
    />
  )
}
