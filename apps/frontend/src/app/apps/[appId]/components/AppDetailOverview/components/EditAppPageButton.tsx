import { IconButton } from "@chakra-ui/react"
import { UilPen } from "@iconscout/react-unicons"
import { useParams, useRouter } from "next/navigation"
import { useCallback } from "react"

export const EditAppPageButton = () => {
  const { appId } = useParams()

  const router = useRouter()
  const handleEdit = useCallback(() => {
    router.push(`/apps/${appId}/edit`)
  }, [appId, router])

  return (
    <>
      <IconButton variant="primaryIconButton" aria-label="Edit App Page" onClick={handleEdit}>
        <UilPen size="20px" />
      </IconButton>
    </>
  )
}
