import { TransactionModal } from "@/components/TransactionModal"
import {
  VStack,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  Heading,
  FormErrorMessage,
  Card,
  CardHeader,
  CardBody,
  useDisclosure,
  Radio,
  RadioGroup,
  Text,
  Badge,
  HStack,
  Icon,
  As,
} from "@chakra-ui/react"
import { UilCheckCircle, UilExclamationCircle } from "@iconscout/react-unicons"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { useAdminCreatorNFT } from "@/hooks/useAdminCreatorNFT"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { WalletAddressInput } from "@/app/components/Input"

type NFTFormInputs = {
  creatorInput?: string
  tokenId?: string
  lookupInput?: string
  actionType?: string
}

export const ManageCreatorsNFT = () => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<NFTFormInputs>({
    defaultValues: { creatorInput: "", tokenId: "", lookupInput: "", actionType: "mint" },
  })
  const [creatorWalletAddress, setCreatorWalletAddress] = useState<string>("")
  const [lookupAddress, setLookupAddress] = useState<string>("")

  const [tokenId, actionType] = watch(["tokenId", "actionType"])
  const { mintNFT, burnNFT } = useAdminCreatorNFT({
    walletAddress: creatorWalletAddress ?? "",
    tokenId: tokenId ?? "",
    onSuccess: onClose,
  })

  const hasNFT = useHasCreatorNFT(lookupAddress ?? "")

  const { error, status, txReceipt, sendTransaction, resetStatus } = useMemo(() => {
    return actionType === "mint" ? mintNFT : burnNFT
  }, [actionType, mintNFT, burnNFT])

  const onSubmit = useCallback(() => {
    if (actionType !== "check") {
      resetStatus()
      sendTransaction()
      onOpen()
    }
  }, [actionType, resetStatus, sendTransaction, onOpen])

  const renderBadge = (colorScheme: string, icon: As, text: string) => (
    <Badge
      textTransform="none"
      fontSize="sm"
      colorScheme={colorScheme}
      display="flex"
      alignItems="center"
      borderRadius="12px"
      p={2}>
      <HStack align="start" spacing={2}>
        <Icon as={icon} color={colorScheme === "green" ? "green.500" : "red.500"} />
        <Text as="span" wordBreak="break-word" whiteSpace="normal">
          {text}
        </Text>
      </HStack>
    </Badge>
  )

  return (
    <>
      <Card w="full">
        <CardHeader>
          <Heading size="lg">{t("Manage Creator NFT")}</Heading>
        </CardHeader>

        <CardBody>
          <VStack spacing={8} align="start" w="full">
            <RadioGroup defaultValue="mint">
              <VStack align="start">
                <Radio {...register("actionType", { required: true })} value="mint">
                  {t("Mint NFT")}
                </Radio>
                <Radio {...register("actionType", { required: true })} value="burn">
                  {t("Burn NFT")}
                </Radio>
                <Radio {...register("actionType", { required: true })} value="check">
                  {t("Check Ownership")}
                </Radio>
              </VStack>
            </RadioGroup>

            <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
              <VStack spacing={4} align="start">
                {actionType === "mint" && (
                  <FormControl isRequired isInvalid={Boolean(errors.creatorInput)}>
                    <FormLabel>
                      <strong>{t("Wallet Address")}</strong>
                    </FormLabel>
                    <InputGroup>
                      <WalletAddressInput
                        inputName="creatorInput"
                        watch={watch}
                        register={register}
                        setError={setError}
                        clearErrors={clearErrors}
                        onAddressResolved={address => setCreatorWalletAddress(address ?? "")}
                      />
                    </InputGroup>
                    {errors.creatorInput && <FormErrorMessage>{errors.creatorInput.message}</FormErrorMessage>}
                  </FormControl>
                )}
                {actionType === "burn" && (
                  <FormControl isRequired isInvalid={Boolean(errors.tokenId)}>
                    <FormLabel>
                      <strong>{t("Token ID")}</strong>
                    </FormLabel>
                    <InputGroup>
                      <Input
                        placeholder={t("Enter the token ID")}
                        {...register("tokenId", {
                          required: actionType === "burn",
                        })}
                      />
                    </InputGroup>
                    {errors.tokenId && <FormErrorMessage>{errors.tokenId.message}</FormErrorMessage>}
                  </FormControl>
                )}
                {actionType === "check" && (
                  <FormControl isInvalid={Boolean(errors.lookupInput)}>
                    <FormLabel>
                      <strong>{t("Lookup Wallet Address")}</strong>
                    </FormLabel>
                    <InputGroup>
                      <WalletAddressInput
                        inputName="lookupInput"
                        watch={watch}
                        setError={setError}
                        clearErrors={clearErrors}
                        register={register}
                        onAddressResolved={address => setLookupAddress(address ?? "")}
                      />
                    </InputGroup>
                    {errors.lookupInput && <FormErrorMessage>{errors.lookupInput.message}</FormErrorMessage>}
                    {lookupAddress && (
                      <VStack mt={2} align="start">
                        {renderBadge(
                          hasNFT ? "green" : "red",
                          hasNFT ? UilCheckCircle : UilExclamationCircle,
                          hasNFT ? t("This address holds the NFT.") : t("This address does not hold the NFT."),
                        )}
                      </VStack>
                    )}
                  </FormControl>
                )}
                {actionType !== "check" && (
                  <Button
                    colorScheme="blue"
                    type="submit"
                    isDisabled={actionType === "mint" ? !creatorWalletAddress : !tokenId}>
                    {t(actionType === "mint" ? "Mint" : "Burn")}
                  </Button>
                )}
              </VStack>
            </form>
          </VStack>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        status={error ? "error" : status}
        successTitle={t("Transaction successful")}
        onTryAgain={handleSubmit(onSubmit)}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID}
        pendingTitle={t("Processing transaction...")}
        errorTitle={t("Transaction error")}
        errorDescription={error?.reason}
      />
    </>
  )
}
