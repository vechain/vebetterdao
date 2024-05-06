import { Card } from "@chakra-ui/react"

type Props = {
  children: React.ReactNode
}

// TODO: move it to components folder? are all the cards like this one?
export const BaseCard = ({ children }: Props) => {
  return (
    <Card border="1px solid #D5D5D5" rounded="16px" p="24px">
      {children}
    </Card>
  )
}
