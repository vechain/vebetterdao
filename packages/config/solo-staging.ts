import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x1D97373F17D1Bfc33398fec4E5dFD4f743683b4C",
  "vot3ContractAddress": "0x5B67a27DC047833c342d81b75e1bA1988b9b70aC",
  "b3trGovernorAddress": "0x4E635Dab176847f147A1B2EA45C0299E2947E695",
  "timelockContractAddress": "0x0303fcF842d4E768D50813e72530A78527B6610b",
  "xAllocationPoolContractAddress": "0xC67e1f7f7c95332e3aF24B732C7d6926301a5d50",
  "xAllocationVotingContractAddress": "0x7f39E9E8573a9DC6092bD2E4bB844E769549D21E",
  "emissionsContractAddress": "0x673329362e3679E137b7162C5fd09128c966e18e",
  "voterRewardsContractAddress": "0x5cc1B2406D129953a7FfaEE6A5AD3d0e952ceDAa",
  "nftBadgeContractAddress": "0x2f1573B153E1d8B7ac87DC384ab015e2c9d6fd79",
  "mixPanelProjectToken": "e03f4f5f6a753dae2dac30a69dfe21f7",
  "nodeUrl": "https://thor-solo.dev.b3tr.vechain.org/",
  "network": {
    "id": "solo-staging",
    "name": "solo-staging",
    "type": "solo",
    "defaultNet": true,
    "urls": [
      "https://thor-solo.dev.b3tr.vechain.org/"
    ],
    "explorerUrl": "https://insight.dev.b3tr.vechain.org/#/solo/",
    "blockTime": 10000,
    "genesis": {
      "number": 0,
      "id": "0x00000000c05a20fbca2bf6ae3affba6af4a74b800b585bf7a4988aba7aea69f6",
      "size": 170,
      "parentID": "0xffffffff53616c757465202620526573706563742c20457468657265756d2100",
      "timestamp": 1530316800,
      "gasLimit": 10000000,
      "beneficiary": "0x0000000000000000000000000000000000000000",
      "gasUsed": 0,
      "totalScore": 0,
      "txsRoot": "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
      "txsFeatures": 0,
      "stateRoot": "0x93de0ffb1f33bc0af053abc2a87c4af44594f5dcb1cb879dd823686a15d68550",
      "receiptsRoot": "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
      "signer": "0x0000000000000000000000000000000000000000",
      "isTrunk": true,
      "transactions": []
    }
  }
};
  export default config;