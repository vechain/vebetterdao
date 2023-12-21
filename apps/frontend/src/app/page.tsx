"use client";

import { useB3trTokenDetails } from "@/api";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Heading,
  Progress,
  StackDivider,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo } from "react";

import { FormattingUtils } from "@repo/utils";

export default function Home() {
  const { data: tokenDetails } = useB3trTokenDetails();

  const supplyProgressPercentage = useMemo(() => {
    if (!tokenDetails) {
      return 0;
    }
    return (Number(tokenDetails.circulatingSupply) / Number(tokenDetails.totalSupply)) * 100;
  }, [tokenDetails]);

  const formattedCirculatingSupply = useMemo(() => {
    if (!tokenDetails) {
      return 0;
    }
    const scaledNumber = FormattingUtils.scaleNumberDown(tokenDetails.circulatingSupply, tokenDetails.decimals);
    return FormattingUtils.humanNumber(scaledNumber, scaledNumber);
  }, [tokenDetails]);

  const formattedTotalSupply = useMemo(() => {
    if (!tokenDetails) {
      return 0;
    }
    const scaledNumber = FormattingUtils.scaleNumberDown(tokenDetails.totalSupply, tokenDetails.decimals);
    return FormattingUtils.humanNumber(scaledNumber, scaledNumber);
  }, [tokenDetails]);

  return (
    <VStack spacing={4} divider={<StackDivider />}>
      <Box>
        <Heading as="h1" size="2xl">
          Welcome to the B3TR demo
        </Heading>
        <Text>Use the navigation bar on the left to navigate to the different pages.</Text>
      </Box>
      <Card w="full">
        <CardHeader>
          <Heading size="sm">Token Details</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} divider={<StackDivider />} w="full" justify={"flex-start"} align={"flex-start"}>
            <Box>
              <Heading size="xs" textTransform="uppercase">
                Name
              </Heading>
              <Text pt="2" fontSize="sm">
                {tokenDetails?.name}
              </Text>
            </Box>
            <Box>
              <Heading size="xs" textTransform="uppercase">
                Symbol
              </Heading>
              <Text pt="2" fontSize="sm">
                {tokenDetails?.symbol}
              </Text>
            </Box>

            <Box>
              <Heading size="xs" textTransform="uppercase">
                Decimals
              </Heading>
              <Text pt="2" fontSize="sm">
                {tokenDetails?.decimals}
              </Text>
            </Box>
            <Box w="full">
              <Heading size="xs" textTransform="uppercase">
                Circulating Supply
              </Heading>
              <VStack w="full" spacing={1}>
                <Progress mt="4" value={supplyProgressPercentage} w="full" />
                <HStack w="full" justify="space-between">
                  <Text fontSize="sm" textAlign="right">
                    {formattedCirculatingSupply} {tokenDetails?.symbol}
                  </Text>
                  <Text fontSize="sm" textAlign="left">
                    {formattedTotalSupply} {tokenDetails?.symbol}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}
