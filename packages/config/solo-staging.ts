import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xD1d7B36748E25ce63fD807B0B95f26467432e5b4",
  "vot3ContractAddress": "0xa6EbE7525395FBE01a6B5bC2a212C4cA09364cc0",
  "b3trGovernorAddress": "0x89E3fe1dbF1DE92F61fFeb4EFd40E91d0A6d4ff9",
  "timelockContractAddress": "0x4068A3b99A45ac49aCA24666b9682201417deCEa",
  "xAllocationPoolContractAddress": "0x4350Ec5c5f7831529eeAD3efE78877ACB9F3F865",
  "xAllocationVotingContractAddress": "0x82C68543fCAb4687981E7DBD58444e316dD9eD81",
  "emissionsContractAddress": "0x753ea1cF2069bF825514509C264d1Cf459197c55",
  "voterRewardsContractAddress": "0x2c5534881a8B092B8FD6e7777680eAf2F8F6AbD6",
  "galaxyMemberContractAddress": "0x40858F50b00544ac8B4D563a7E7bCcAaa3Fa8393",
  "treasuryContractAddress": "0x602741296c5fd104e90740035d0e37Df6D89a49e",
  "x2EarnAppsContractAddress": "0x371444b07aC15FcaE88001Ae35DA064cAb843b59",
  "mixPanelProjectToken": "e03f4f5f6a753dae2dac30a69dfe21f7",
  "nodeUrl": "https://thor-solo.dev.b3tr.vechain.org",
  "network": {
    "id": "solo-staging",
    "name": "solo-staging",
    "type": "solo",
    "defaultNet": true,
    "urls": [
      "https://thor-solo.dev.b3tr.vechain.org"
    ],
    "explorerUrl": "https://insight.dev.b3tr.vechain.org/#/solo",
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