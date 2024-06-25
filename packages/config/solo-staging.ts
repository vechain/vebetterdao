import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x96c369D38D77B52914148E2045FE695614aA3918",
  "vot3ContractAddress": "0x674223ccC99b21E4DC062e7Ad5954f985Ed5DCE9",
  "b3trGovernorAddress": "0x527Fe60c5391960aB0FDA0e01Be709D9e6Ba8281",
  "timelockContractAddress": "0x4C39adfc3159AC386815C36fa004153D1aF5C049",
  "xAllocationPoolContractAddress": "0x7a17C57601886d76a4594ab2aCB8219990197981",
  "xAllocationVotingContractAddress": "0xd53648982bf2D0110814F7d2F091985584daBb93",
  "emissionsContractAddress": "0xDA4fAAD8102248e28Fe7b4Da45b6591f7A182b92",
  "voterRewardsContractAddress": "0xb4DD968c1d5FF6b4B92B1c788E7770F77c1F2749",
  "galaxyMemberContractAddress": "0x8Bd0e1d0ac8C4f725fc707E51D5EA645981C0e42",
  "treasuryContractAddress": "0x163e8D98E26112398b7741689409A805D106Aaf9",
  "x2EarnAppsContractAddress": "0x172f37f396Fb330Cb6DFacea01C71A9301C08939",
  "x2EarnRewardsPoolContractAddress": "0x39f94315fFe15ECC37DEDc8EA106044DC10A28cA",
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