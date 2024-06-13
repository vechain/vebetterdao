import { Button, HStack, Heading, Input, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { EditAppForm } from "../EditAppPageModal"
import { useCallback, useRef } from "react"
import { UilUpload } from "@iconscout/react-unicons"

type Props = {
  form: UseFormReturn<EditAppForm, any, undefined>
}

export const EditScreenshots = ({ form }: Props) => {
  const { t } = useTranslation()
  const inputFile = useRef<HTMLInputElement>(null)
  const handleUpload = useCallback(() => {
    inputFile.current?.click()
  }, [])
  const onDrop = useCallback(e => {
    console.log(e.target.files)
  }, [])

  return (
    <VStack align="stretch" gap={6}>
      <HStack justify={"space-between"}>
        <Heading fontSize="24px" fontWeight="700">
          {t("Edit screenshots")}
        </Heading>
        <Button variant="primaryAction" onClick={handleUpload} leftIcon={<UilUpload size="16px" />}>
          {t("Upload new screenshots")}
        </Button>
        <Input type="file" ref={inputFile} display="none" onChange={onDrop} />
      </HStack>
    </VStack>
  )
}
