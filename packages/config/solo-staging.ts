import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xC6e58d48328FAcc62eE432b28c9e466676fDc0cd",
  "vot3ContractAddress": "0xBa7617c5c39D5DbD1752736c76ac8fcaba5BaecD",
  "b3trGovernorAddress": "0xcdc1aAAc68D2867e4eaa4e4c5927160287eF9c8c",
  "timelockContractAddress": "0x22EE8FC5ee7ed8927245de0bf404f33D7E9af91E",
  "xAllocationPoolContractAddress": "0x01664e71f2bc2bD28176681573a98F6110a70b24",
  "xAllocationVotingContractAddress": "0xebFa86bc8F152EA6629030EB45fe5eCEBf771dC5",
  "emissionsContractAddress": "0xDB8f15b309e20dCac0D353f84Da55d9C8acD5ca6",
  "voterRewardsContractAddress": "0xdf9985DD2A27ac3d243575806B15dc5289A13183",
  "nftBadgeContractAddress": "0x104781d6FdEA6a7c08C4C394Cb746968dEc645f0",
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