import React, { createContext, useContext, type ReactNode } from "react"

import { getMockAddress } from "../../.storybook/mockAddressState"

// Mock types matching @vechain/vechain-kit
interface MockAccount {
  address: string
}

interface MockWalletContext {
  account: MockAccount | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  switchChain: () => Promise<void>
}

const MockWalletContext = createContext<MockWalletContext>({
  account: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
  switchChain: async () => {},
})

// ============================================================================
// HOOKS
// ============================================================================

export const useWallet = () => {
  const context = useContext(MockWalletContext)
  const mockAddress = getMockAddress()
  if (!mockAddress) return context

  return {
    ...context,
    account: { address: mockAddress },
    isConnected: true,
  }
}

export const useVechainDomain = (_address: string) => {
  return {
    data: _address ? { domain: "demo.vet" } : null,
    isLoading: false,
    error: null,
  }
}

export const useThor = () => {
  return {
    currentBlock: { number: 1000000, timestamp: Date.now() / 1000 },
    getBlock: async () => ({ number: 1000000, timestamp: Date.now() / 1000 }),
  }
}

export const useCurrentBlock = () => {
  return {
    data: { number: 1000000, timestamp: Date.now() / 1000 },
    isLoading: false,
  }
}

export const useAccountBalance = (_address?: string) => {
  return {
    data: {
      vet: "1000000000000000000000",
      vtho: "500000000000000000000",
    },
    isLoading: false,
    error: null,
  }
}

export const useCallClause = (_params: any) => {
  return {
    data: null,
    isLoading: false,
    error: null,
  }
}

export const useSendTransaction = () => {
  return {
    sendTransaction: async () => ({ id: "0xmocktxid" }),
    isLoading: false,
    error: null,
  }
}

export const useWalletModal = () => {
  return {
    open: () => {},
    close: () => {},
    isOpen: false,
  }
}

export const useUpgradeSmartAccountModal = () => {
  return {
    open: () => {},
    close: () => {},
    isOpen: false,
  }
}

export const useUpgradeRequired = () => {
  return {
    isRequired: false,
    isLoading: false,
  }
}

export const useGetVot3Balance = (_address?: string) => {
  return {
    data: { balance: "0", formatted: "0" },
    isLoading: false,
    error: null,
  }
}

export const useGetTokenUsdPrice = (_tokenAddress?: string) => {
  return {
    data: { price: 1.0 },
    isLoading: false,
    error: null,
  }
}

export const useGetAvatarOfAddress = (_address?: string) => {
  return {
    data: "/assets/backgrounds/your-ranking-bg.svg",
    isLoading: false,
    error: null,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const executeCallClause = async (_params: any) => {
  return null
}

export const executeMultipleClausesCall = async (_params: any) => {
  return []
}

export const getAllEventLogs = async (_params: any) => {
  return []
}

export const decodeEventLog = (_params: any) => {
  return null
}

// ============================================================================
// QUERY KEY HELPERS
// ============================================================================

export const getAccountBalanceQueryKey = (address: string) => ["accountBalance", address]

export const getCallClauseQueryKey = (params: any) => ["callClause", params]

export const getCallClauseQueryKeyWithArgs = (params: any) => ["callClause", params]

export const currentBlockQueryKey = ["currentBlock"]

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedClause {
  to: string
  value?: string
  data?: string
  abi?: any
  comment?: string
}

export interface ThorClient {
  currentBlock: () => Promise<any>
  getBlock: (block: string | number) => Promise<any>
}

export interface TokenBalance {
  balance: string
  formatted: string
}

export interface XAppMetadata {
  name: string
  description: string
  icon: string
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum TransactionStatusErrorType {
  REVERTED = "reverted",
  TIMEOUT = "timeout",
}

export interface UseSendTransactionReturnValue {
  sendTransaction: (_params: any) => Promise<any>
  isLoading: boolean
  error: Error | null
}

export interface MultipleClausesCallParameters {
  clauses: EnhancedClause[]
  caller?: string
}

// ============================================================================
// COMPONENTS
// ============================================================================

export interface WalletButtonProps {
  children?: ReactNode
  className?: string
  [key: string]: any
}

export const WalletButton = ({ children, ...props }: WalletButtonProps) => {
  return <button {...props}>{children || "Connect Wallet"}</button>
}

interface VeChainKitProviderProps {
  children: ReactNode
  [key: string]: any
}

export const VeChainKitProvider = ({ children }: VeChainKitProviderProps) => {
  const mockAddress = getMockAddress()
  const mockWalletValue: MockWalletContext = {
    account: mockAddress ? { address: mockAddress } : null,
    isConnected: !!mockAddress,
    isConnecting: false,
    connect: async () => {},
    disconnect: async () => {},
    switchChain: async () => {},
  }

  return <MockWalletContext.Provider value={mockWalletValue}>{children}</MockWalletContext.Provider>
}
