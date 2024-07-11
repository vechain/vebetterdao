import { DOCUMENTATION_URL } from "@/constants"
import { Button, Link, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaBook } from "react-icons/fa6"

type Props = {
  isFullWidth?: boolean
}

export const DocumentationButton: React.FC<Props> = ({ isFullWidth }) => {
  const { t } = useTranslation()
  return (
    <Link href={DOCUMENTATION_URL} isExternal w={isFullWidth ? "full" : undefined}>
      <Button
        leftIcon={<FaBook size={24} />}
        textColor={"black"}
        bgColor={`#ffffff`}
        _hover={{ bg: "#f0f0f0" }}
        borderRadius={22}
        w={isFullWidth ? "full" : undefined}>
        <Text fontWeight={500} fontSize="16px" lineHeight="19px">
          {t("Documentation")}
        </Text>
      </Button>
    </Link>
  )
}
