import { useWallet } from "@vechain/dapp-kit-react"
import { useGetPassportForEntity } from "./useGetPassportForEntity"
import { useGetUserPendingLinkings } from "./useGetPendingLinkings"
import { useIsUserEntity } from "./useIsEntity"
import { useGetEntitiesLinkedToPassport, useGetUserEntitiesLinkedToPassport } from "./useGetEntitiesLinkedToPassport"
import { useMemo } from "react"

/**
 * Hook to get the account linking status of the current user.
 * @returns The account linking status of the current user.
 */
export const useAccountLinking = () => {
  const { account } = useWallet()

  const { data: isEntity, isLoading: isEntityLoading } = useIsUserEntity()
  const { data: userLinkedEntities, isLoading: isUserLinkedEntitiesLoading } = useGetUserEntitiesLinkedToPassport()
  const isPassport = !isEntity && userLinkedEntities?.length > 0

  // if the user is an entity, get the passport for that entity
  const { data: entityPassport, isLoading: isEntityPassportLoading } = useGetPassportForEntity(
    !!isEntity ? account : undefined,
  )
  const isLinked = !!isPassport || !!isEntity

  // if the user is an entity, use the entity's passport, otherwise use the user's account
  const passport = useMemo(() => {
    if (isEntity) return entityPassport ?? undefined
    if (isPassport) return account
    return undefined
  }, [isEntity, entityPassport, isPassport, account])

  // if linked, get the entities linked to the passport
  const { data: passportLinkedEntities, isLoading: isPassportLinkedEntitiesLoading } = useGetEntitiesLinkedToPassport(
    isLinked ? passport : undefined,
  )

  const { data: pendingLinkings, isLoading: isPendingLinkingsLoading } = useGetUserPendingLinkings()

  const incomingPendingLinkings = pendingLinkings?.incoming || []
  const outgoingPendingLink = Number(pendingLinkings?.outgoing) ? pendingLinkings?.outgoing : undefined

  const isLoading =
    isUserLinkedEntitiesLoading ||
    isPassportLinkedEntitiesLoading ||
    isEntityPassportLoading ||
    isEntityLoading ||
    isPendingLinkingsLoading

  console.log({
    isLinked,
    passport,
    isPassport,
    isEntity,
    passportLinkedEntities: passportLinkedEntities ?? [],
    incomingPendingLinkings,
    outgoingPendingLink,
    isLoading,
  })

  return {
    isLinked,
    passport,
    isPassport,
    isEntity,
    passportLinkedEntities: passportLinkedEntities ?? [],
    incomingPendingLinkings,
    outgoingPendingLink,
    isLoading,
  }
}
