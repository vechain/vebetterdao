"use client"

import { CloseButton, Flex, IconButton, Input, InputGroup } from "@chakra-ui/react"
import { NavArrowLeft } from "iconoir-react"
import { useRef } from "react"

import { BaseBottomSheet } from "@/components/BaseBottomSheet"

interface SearchBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
  ariaTitle: string
  ariaDescription: string
  children: React.ReactNode
}

export function SearchBottomSheet({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  placeholder = "Search",
  ariaTitle,
  ariaDescription,
  children,
}: SearchBottomSheetProps) {
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
      ariaTitle={ariaTitle}
      ariaDescription={ariaDescription}
      isDismissable={true}
      minHeight="100dvh">
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
            id="search-input"
            placeholder={placeholder}
            fontSize="1rem"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            px="3"
          />
        </InputGroup>
      </Flex>

      {children}
    </BaseBottomSheet>
  )
}
