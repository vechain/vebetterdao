import { Box, Select } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation()
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const locale = e.target.value
      i18n.changeLanguage(locale)
    },
    [i18n],
  )
  return (
    <Box>
      <Select size="sm" variant="filled" defaultValue="en" onChange={handleChange}>
        <option value="en">{t("🇬🇧")}</option>
        <option value="it">{t("🇮🇹")}</option>
      </Select>
    </Box>
  )
}
