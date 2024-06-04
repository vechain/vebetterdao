import { ProposalFormAction } from "@/store"

export const transferAction: ProposalFormAction = {
  abiDefinition: {
    inputs: [
      {
        internalType: "address",
        name: "_to",
        requiresEthParse: false,
        type: "address",
      },
      { internalType: "uint256", name: "_value", requiresEthParse: true, type: "uint256" },
    ],
    name: "transferB3TR",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  calldata:
    "0x8e184b3f0000000000000000000000006b020e5c8e8574388a275cc498b27e3eb91ec3f20000000000000000000000000000000000000000000000008ac7230489e80000",
  contractAddress: "0x394413DA4e0d8D1791Fa4a3f812bee97d142590B",
  description: "Transfer B3TR tokens to a recipient",
  name: "Transfer B3TR",
}
