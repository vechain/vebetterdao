import { languages } from "@/i18n"
import { Box, NativeSelect } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation()
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const locale = e.target.value
      i18n.changeLanguage(locale)
    },
    [i18n],
  )
  return (
    <Box>
      <NativeSelect.Root variant="filled">
        <NativeSelect.Field
          defaultValue={i18n.resolvedLanguage}
          onChange={handleChange}
          rounded={"full"}
          border={"1px solid #EEEEEE"}
          bg={"#FFFFFF"}
          _focusVisible={{
            bg: "#FFFFFF",
          }}>
          {languages.map(language => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.name}
            </option>
          ))}
        </NativeSelect.Field>
      </NativeSelect.Root>
    </Box>
  )
}
