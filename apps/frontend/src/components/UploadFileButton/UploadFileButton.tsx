import { Input, Button, ButtonProps } from "@chakra-ui/react"
import { useId, ChangeEventHandler, forwardRef } from "react"
import { useTranslation } from "react-i18next"
import { FaFile } from "react-icons/fa6"

interface Props extends Omit<ButtonProps, "onChange"> {
  onChange: ChangeEventHandler<HTMLInputElement>
}
export const UploadFileButton = forwardRef<HTMLButtonElement, Props>(({ onChange, ...props }, ref) => {
  const { t } = useTranslation()
  const id = useId()
  return (
    <Button
      ref={ref}
      as="label"
      cursor="pointer"
      // htmlFor={id}
      variant="outline"
      colorPalette="blue"
      rounded="full"
      {...props}>
      <FaFile />
      {t("Upload File")}
      <Input display="none" type="file" id={id} name={id} onChange={onChange} />
    </Button>
  )
})
