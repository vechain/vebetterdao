import { TokenDetails, useB3trBalance } from "@/api";
import { Card, CardHeader, CardBody, Heading, Text, HStack } from "@chakra-ui/react";
import { FormattingUtils } from "@repo/utils";
import { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

type Props = {
  address?: string;
  tokenDetailsQueryResult: UseQueryResult<TokenDetails, Error>;
};
export const BalanceCard = ({ address, tokenDetailsQueryResult: { data: tokenDetails } }: Props) => {
  const { data: balance, isLoading } = useB3trBalance(address);

  const formattedBalance = useMemo(() => {
    if (!balance) {
      return 0;
    }

    const decimals = tokenDetails?.decimals ?? 18;

    const scaledNumber = FormattingUtils.scaleNumberDown(balance, decimals);
    return FormattingUtils.humanNumber(scaledNumber, scaledNumber);
  }, [tokenDetails]);

  if (!balance && !isLoading)
    return (
      <Card w="full">
        <CardHeader>
          <Heading size="sm">Your balance</Heading>
        </CardHeader>
        <CardBody>
          <Heading size="md">Unable to load your balance</Heading>
          <Text fontSize="sm">Connect your wallet first</Text>
        </CardBody>
      </Card>
    );

  return (
    <Card w="full">
      <CardHeader>
        <Heading size="sm">Your balance</Heading>
      </CardHeader>
      <CardBody>
        <HStack spacing={2}>
          <Heading size="lg">{formattedBalance}</Heading>
          <Text fontSize="sm" as="sub">
            {tokenDetails?.symbol}
          </Text>
        </HStack>
      </CardBody>
    </Card>
  );
};
