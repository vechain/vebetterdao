import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xC78d0cCA92EE68a30F9653e7D7474b681ACb432B",
  "vot3ContractAddress": "0x3198A5C2982F230858bB64D72557cccB89DF022a",
  "b3trGovernorAddress": "0x7f23e593A9FCC497E04C0248586786d55CA8d41b",
  "timelockContractAddress": "0x679f8365F4dF5B257B1C0748A3C3A41ff2A5c43e",
  "xAllocationPoolContractAddress": "0x0140160BC1C7F15F303D5E39Ec99D2d41843651A",
  "xAllocationVotingContractAddress": "0xa70F4F1D348CaCda986FA4440948e1007E46e7c3",
  "emissionsContractAddress": "0x5f3f23496b8A013B8ceFDc4b295C1e8839E4F02b",
  "voterRewardsContractAddress": "0xe4a0bC3A28760dD5E22a88d8Bf44522d2eC8dAF0",
  "galaxyMemberContractAddress": "0x4Fe06F7f2B7E48c95d1d40c195E9F6435ceC4f99",
  "treasuryContractAddress": "0x39360d929644568174f617754310CfB4f4b8B8d1",
  "x2EarnAppsContractAddress": "0xbE0CaFed99b3C156F7ca14a54AB11aaed51d3BA6",
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