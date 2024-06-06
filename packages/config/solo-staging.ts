import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x248f1E7ce2C3D0075f0935c65b9aF4F7BD1aac0A",
  "vot3ContractAddress": "0xd4CdA81d4E121C6893E0B27A98B2a795141D8f81",
  "b3trGovernorAddress": "0x415266A153f8b57a48627d3A7A626988d1639109",
  "timelockContractAddress": "0xf1e5653cC94F8EB6dB2857244b204346278D3553",
  "xAllocationPoolContractAddress": "0x158a46e0BD2fA7146dcaEb5c36305CC70339C0C5",
  "xAllocationVotingContractAddress": "0xebCf45F8B092E5326D03ED283BDdC71e0e121544",
  "emissionsContractAddress": "0x7673516E35686c3913824e250882D260F812B67A",
  "voterRewardsContractAddress": "0x4ca3574f86F4D618662A638257C5A2E7370714BF",
  "galaxyMemberContractAddress": "0x5732E57A37B468505797F41F09b61DB72CC25ec7",
  "treasuryContractAddress": "0x5BEc896111FA1b033Ab55cFf03F9817945fF1CB8",
  "x2EarnAppsContractAddress": "0x9C87a5167C26d7cF7eb7663e46D70B66dF96c875",
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