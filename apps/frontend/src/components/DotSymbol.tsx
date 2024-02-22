import { Text } from "@chakra-ui/react"

type Props = {
  color?: string
}

export const DotSymbol: React.FC<Props> = ({ color = "inherit" }) => {
  return (
    <Text color={color} fontSize={"small"}>
      &#8226;
    </Text>
  )
}
