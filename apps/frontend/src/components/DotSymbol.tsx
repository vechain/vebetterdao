import { Box } from "@chakra-ui/react"

type Props = {
  color?: string
  size?: string | number
}

export const DotSymbol: React.FC<Props> = ({ color = "inherit", size = 1.5 }) => {
  return <Box w={size} h={size} bg={color} borderRadius={"full"} />
}
