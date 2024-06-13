import { AddressIcon } from "@/components/AddressIcon"
import {
  FormControl,
  FormErrorMessage,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
} from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { EditAppForm } from "./AppEditPageContent"
import { RiTwitterXFill } from "react-icons/ri"
import { URL_REGEX } from "@/constants"
import { useCurrentAppAdmin } from "@/app/apps/[appId]/hooks/useCurrentAppAdmin"

type Props = {
  form: UseFormReturn<EditAppForm, any, undefined>
}

export const EditTeamXProfiles = ({ form }: Props) => {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  const { admin } = useCurrentAppAdmin()
  return (
    <VStack align="stretch" gap={6}>
      <Heading fontSize="24px" fontWeight="700">
        {t("Team X Profiles")}
      </Heading>
      <HStack>
        <VStack align="stretch">
          <HStack>
            <AddressIcon address={admin || ""} rounded="full" h="48px" w="48px" />
            <VStack align="stretch" gap={1} py={0.5}>
              <Text fontWeight="600">{humanAddress(admin || "", 4, 6)}</Text>
              <Text color="#7D7D7D" fontSize="14px">
                {t("App admin")}
              </Text>
            </VStack>
          </HStack>
          <FormControl isInvalid={!!errors.adminTwitterAccount}>
            <InputGroup>
              <InputLeftElement>
                <RiTwitterXFill />
              </InputLeftElement>
              <Input
                rounded="full"
                fontSize={"14px"}
                type="url"
                placeholder={t("Add your x.com link")}
                defaultValue={""} // TODO: change it with actual app admin twitter account
                {...register("adminTwitterAccount", {
                  pattern: {
                    value: URL_REGEX,
                    message: t("Invalid url"),
                  },
                })}
              />
            </InputGroup>
            <FormErrorMessage>{errors.adminTwitterAccount?.message}</FormErrorMessage>
          </FormControl>
        </VStack>
      </HStack>
    </VStack>
  )
}
