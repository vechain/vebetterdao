import { TokenDetails } from "@/api"
import {
  Card,
  CardHeader,
  CardBody,
  VStack,
  Heading,
  Text,
  Box,
  StackDivider,
  HStack,
  Progress,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"

type Props = {
  tokenDetailsQueryResult: UseQueryResult<TokenDetails, Error>
}
export const TokenDetailsCard = ({ tokenDetailsQueryResult: { data: tokenDetails, isLoading, error } }: Props) => {
  const supplyProgressPercentage = useMemo(() => {
    if (!tokenDetails) {
      return 0
    }
    return (Number(tokenDetails.circulatingSupply) / Number(tokenDetails.totalSupply)) * 100
  }, [tokenDetails])

  const formattedCirculatingSupply = useMemo(() => {
    if (!tokenDetails) {
      return 0
    }
    return FormattingUtils.humanNumber(tokenDetails.circulatingSupply, tokenDetails.circulatingSupply)
  }, [tokenDetails])

  const formattedTotalSupply = useMemo(() => {
    if (!tokenDetails) {
      return 0
    }
    return FormattingUtils.humanNumber(tokenDetails.totalSupply, tokenDetails.totalSupply)
  }, [tokenDetails])

  if (error)
    return (
      <Card w="full">
        <CardHeader>
          <Heading size="sm">Token Details</Heading>
        </CardHeader>
        <CardBody>
          <Heading size="lg" textAlign={"center"}>
            Unable to load token details
          </Heading>
          <Text fontSize="sm" textAlign={"center"}>
            {error.message}
          </Text>
        </CardBody>
      </Card>
    )

  if (!tokenDetails && !isLoading)
    return (
      <Card w="full">
        <CardHeader>
          <Heading size="sm">Token Details</Heading>
        </CardHeader>
        <CardBody>
          <Heading size="lg" textAlign={"center"}>
            Unable to load token details
          </Heading>
          <Text fontSize="sm" textAlign={"center"}>
            Is the smart contract deployed and connected properly?
          </Text>
        </CardBody>
      </Card>
    )

  return (
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
  )
}
