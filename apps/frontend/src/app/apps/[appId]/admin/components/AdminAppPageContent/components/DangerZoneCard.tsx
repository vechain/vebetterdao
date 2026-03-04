import { Heading, VStack, Separator } from "@chakra-ui/react"
import { Children, isValidElement, ReactNode } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  children: ReactNode
}

export const DangerZoneCard = ({ children }: Props) => {
  const { t } = useTranslation()
  const childArray = Children.toArray(children)

  return (
    <VStack align="stretch" borderWidth="1px" borderColor="status.negative.primary" rounded="xl" p={6} gap={0}>
      <Heading size="lg" color="status.negative.primary" mb={4}>
        {t("Danger Zone")}
      </Heading>
      {childArray.map((child, index) => {
        const key = isValidElement(child) ? child.key : index
        return (
          <VStack key={key} align="stretch" gap={0}>
            {index > 0 && <Separator />}
            {child}
          </VStack>
        )
      })}
    </VStack>
  )
}
