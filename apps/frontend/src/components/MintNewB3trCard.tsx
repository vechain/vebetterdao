import { useB3trTokenDetails, useUserHasMinterRole } from "@/api";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  VStack,
} from "@chakra-ui/react";
import { useWallet } from "@vechain/dapp-kit-react";
import { useForm } from "react-hook-form";
import { AddressUtils } from "@repo/utils";
import { useMemo } from "react";
import { useMintB3tr } from "@/hooks";

type FormData = {
  address?: string;
  amount?: number;
};

export const MintNewB3trCard = () => {
  const { account } = useWallet();
  const { data: tokenDetails } = useB3trTokenDetails();
  const { data: hasMinterRole } = useUserHasMinterRole(account ?? undefined);

  const availableSupply = useMemo(() => {
    if (!tokenDetails) return 0;
    return Number(tokenDetails.totalSupply) - Number(tokenDetails.circulatingSupply);
  }, [tokenDetails]);

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const address = watch("address");
  const amount = watch("amount");

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useMintB3tr({
    address,
    amount: amount?.toString(),
  });

  const onSubmit = async (_data: FormData) => {
    if (address && amount) {
      sendTransaction();
    }
  };

  const isLoading = isTxReceiptLoading || sendTransactionPending;

  return (
    <Card w="full">
      <CardHeader>
        <Heading size="md">Mint New B3TR</Heading>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4} align="center" flexBasis={0} flexGrow={1} flexShrink={1}>
            <FormControl isInvalid={!!errors.address}>
              <FormLabel htmlFor="address">Address</FormLabel>
              <Input
                id="address"
                placeholder="Receiver address..."
                {...register("address", {
                  required: "Address is required",
                  validate: value => AddressUtils.isValid(value) || "Invalid address",
                })}
              />
              <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.amount}>
              <FormLabel htmlFor="amount">Amount</FormLabel>
              <Input
                id="amount"
                placeholder="Amount to mint..."
                {...register("amount", {
                  required: "Amount is required",
                  validate: value =>
                    isNaN(Number(value)) ? "Invalid number" : Number(value) <= availableSupply || "Not enough supply",
                })}
              />
              <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
            </FormControl>
            <Button colorScheme="teal" isLoading={isLoading} type="submit" alignSelf={"flex-end"}>
              Submit
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
};
