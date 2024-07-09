import { languages } from "@/i18n"
import { useLanguage } from "@/store/useLanguage"
import { Box, Select } from "@chakra-ui/react"
import { useCallback } from "react"

export const LanguageSelector: React.FC = () => {
  const { setLanguage, language } = useLanguage()
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const locale = e.target.value
      setLanguage(locale)
    },
    [setLanguage],
  )
  return (
    <Box>
      <Select
        variant="filled"
        defaultValue={language}
        onChange={handleChange}
        rounded={"16px"}
        border={"1px solid #EEEEEE"}
        bg={"rgba(255, 255, 255, 0.50)"}>
        {languages.map(language => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.name}
          </option>
        ))}
      </Select>
    </Box>
  )
}
