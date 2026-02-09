import { Button } from "@chakra-ui/react"
import type { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import { GrantProposalEnriched } from "../../../hooks/proposals/grants/types"

import { DeleteGrantProposalModal } from "./DeleteGrantProposalModal"

const mockProposal: GrantProposalEnriched = {
  id: "1",
  proposer: "0x1234567890123456789012345678901234567890",
  projectName: "Test Project",
  projectDescription: "A test project description",
  teamDescription: "A test team",
  mainGoal: "Testing",
  proposalTitle: "Test Proposal",
  proposalDescription: "Test description",
  allocationPercentage: 10,
  targets: [],
  calldatas: [],
  ipfsDescription: "",
  createdAtBlock: 0,
  roundIndex: 1,
  state: 0,
  startBlock: 0,
  endBlock: 0,
  totalVotes: "0",
  forVotes: "0",
  againstVotes: "0",
  abstainVotes: "0",
}

const meta = {
  title: "pages/grants/DeleteGrantProposalModal",
  component: DeleteGrantProposalModal,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DeleteGrantProposalModal>

export default meta

export const LightMode = () => (
  <DeleteGrantProposalModal proposal={mockProposal}>
    <Button colorPalette="red">Delete Grant</Button>
  </DeleteGrantProposalModal>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const MobileLightMode = () => cloneElement(<LightMode />)
MobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDarkMode = () => cloneElement(<LightMode />)
MobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
