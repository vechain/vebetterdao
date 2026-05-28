import { Grid } from "@chakra-ui/react"

import { AdminMigrationCard } from "./AdminMigrationCard"

export const MigrationTab = () => {
  return (
    <Grid templateColumns="repeat(1, 1fr)" gap="6" w="full">
      <AdminMigrationCard />
    </Grid>
  )
}
