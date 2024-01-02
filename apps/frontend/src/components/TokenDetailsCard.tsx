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
  Spinner,
  Skeleton,
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
        <HStack justify={"space-between"} align={"center"} w="full">
          <Heading size="sm">Token Details</Heading>
          {isLoading && <Spinner size={"sm"} />}
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} divider={<StackDivider />} w="full" justify={"flex-start"} align={"flex-start"}>
          <Box>
            <Heading size="xs" textTransform="uppercase">
              Name
            </Heading>
            <Text pt="2" fontSize="sm">
              <Skeleton isLoaded={!isLoading}>{tokenDetails?.name ?? "B3TR"}</Skeleton>
            </Text>
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase">
              Symbol
            </Heading>
            <Text pt="2" fontSize="sm">
              <Skeleton isLoaded={!isLoading}>{tokenDetails?.symbol ?? "B3TR"}</Skeleton>
            </Text>
          </Box>

          <Box>
            <Heading size="xs" textTransform="uppercase">
              Decimals
            </Heading>
            <Text pt="2" fontSize="sm">
              <Skeleton isLoaded={!isLoading}>{tokenDetails?.decimals ?? 18} </Skeleton>
            </Text>
          </Box>
          <Box w="full">
            <Heading size="xs" textTransform="uppercase">
              Circulating Supply
            </Heading>
            <VStack w="full" spacing={1}>
              <Skeleton isLoaded={!isLoading} w="full" mt="4">
                <Progress value={supplyProgressPercentage} w="full" />
              </Skeleton>
              <HStack w="full" justify="space-between">
                <Text fontSize="sm" textAlign="right">
                  <Skeleton isLoaded={!isLoading}>
                    {formattedCirculatingSupply} {tokenDetails?.symbol ?? "B3TR"}
                  </Skeleton>
                </Text>
                <Text fontSize="sm" textAlign="left">
                  <Skeleton isLoaded={!isLoading}>
                    {formattedTotalSupply} {tokenDetails?.symbol ?? "B3TR"}
                  </Skeleton>
                </Text>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )
}
