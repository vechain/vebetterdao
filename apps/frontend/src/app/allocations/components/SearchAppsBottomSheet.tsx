"use client"

import { CloseButton, Flex, IconButton, Input, InputGroup } from "@chakra-ui/react"
import { NavArrowLeft } from "iconoir-react"
import { useRef } from "react"

import type { AppWithVotes } from "@/app/allocations/lib/data"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"

import { AppCategoryTabs } from "./tabs/vote/AppCategoryTabs"

interface SearchAppsBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  apps?: AppWithVotes[]
  selectedAppIds?: Set<string>
  onToggleApp?: (appId: string) => void
}

export function SearchAppsBottomSheet({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  apps = [],
  selectedAppIds,
  onToggleApp,
}: SearchAppsBottomSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    onSearchChange("")
    onClose()
  }

  const handleClear = () => {
    onSearchChange("")
    inputRef.current?.focus()
  }

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      ariaTitle="Search Apps"
      ariaDescription="Search and filter applications"
      isDismissable={true}
      minHeight="100vh">
      <Flex gap="4" mb="4" alignItems="center" justifyContent="space-between">
        <IconButton minWidth="unset" variant="ghost" boxSize="6" p="0" rounded="full" onClick={handleClose}>
          <NavArrowLeft />
        </IconButton>
        <InputGroup
          flex={1}
          rounded="lg"
          borderColor="border.primary"
          endElement={searchQuery ? <CloseButton size="xs" onClick={handleClear} me="-2" /> : undefined}>
          <Input
            ref={inputRef}
            bg="bg.primary"
            id="search-apps-input"
            placeholder="Search app"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            autoFocus
            px="3"
          />
        </InputGroup>
      </Flex>

      <AppCategoryTabs
        apps={apps}
        searchQuery={searchQuery}
        selectedAppIds={selectedAppIds}
        onToggleApp={onToggleApp}
        showEmptyState
        tabsListProps={{ mb: "0" }}
      />
    </BaseBottomSheet>
  )
}
