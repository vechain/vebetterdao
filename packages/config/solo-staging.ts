import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xfEEBE59e39279588eF908c9A23668a00216a8Db6",
  "vot3ContractAddress": "0x2B7B195F84998088A441461734b5a99Fc08f2B6C",
  "b3trGovernorAddress": "0xC9eeB94366F4fb18A2f3003E300c3c32c0913B74",
  "timelockContractAddress": "0x30d08B447A9074069a3029b3ea5231ce99dEF18a",
  "xAllocationPoolContractAddress": "0x0C9E1AbeA8bB82287CDDD157AB8452794f8a62EE",
  "xAllocationVotingContractAddress": "0x85e0A997d80897e4DA5DD6b1660CC8e4fE330904",
  "emissionsContractAddress": "0xc072A423D4E8D2749932C464d0945BE7760f8Bf6",
  "voterRewardsContractAddress": "0xDfe429Ad4e2E9692CC270778e0a58E3BD633f8F0",
  "galaxyMemberContractAddress": "0x5f262D8c09d11f00bE33DAFc3b806198956fB232",
  "treasuryContractAddress": "0x330B9F12198C1D03616625Cdfa017feeD9e7C600",
  "x2EarnAppsContractAddress": "0xb474008B8f9cF4c01f9149C6F05359f0D5790DbE",
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