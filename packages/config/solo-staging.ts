import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xbDcbe02243dde2150b8438bD12bF40F5C549d861",
  "vot3ContractAddress": "0x7114a2504bBC21af21b1D571cDD9fC2ac17b56A5",
  "b3trGovernorAddress": "0x61eDb0a894D9DA6a3d7Fe4949675F5e9Feb25E11",
  "timelockContractAddress": "0x40917E19351A25cf4551D898A4364bfEafAB05c3",
  "xAllocationPoolContractAddress": "0x8791569957c03964DA853861c9cB9b91f1cC007F",
  "xAllocationVotingContractAddress": "0x4F0a1C89f01d9753603D48171CA8C7Fd923F576F",
  "emissionsContractAddress": "0xa702aD78760C3Bb78765F331F5D47F6b932b4aAD",
  "voterRewardsContractAddress": "0x67788ebf240EE8c6fFDb7b797593fB9B279517bc",
  "nftBadgeContractAddress": "0xC8a0cD1be243BC412A0C84B0150d4e75A4D434A5",
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