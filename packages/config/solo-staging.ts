import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x9A980b610D1675C431804d2Ab3480a5feb2c5aD6",
  "vot3ContractAddress": "0x54757fd70AD4fa547Ad89f7be17779B2ef9252d5",
  "b3trGovernorAddress": "0xF41221F0012Ae341e82C30Ad88A8a396d809b2c4",
  "timelockContractAddress": "0x2D974f60E2C69Bf1fdf27f4c21D123EC7C13baf4",
  "xAllocationPoolContractAddress": "0x34A1c4D01803E917E2a923edAbA298Ad09E5eFE9",
  "xAllocationVotingContractAddress": "0x26044dedD1665CC0B5Ed1C1fb3180f4F902cBE8B",
  "emissionsContractAddress": "0x652dc1806CC4CFe6daC5e59f9DffA4211c209aA3",
  "voterRewardsContractAddress": "0x7F1ff2D5780Fb24e5797504494898bcf6D4ade83",
  "galaxyMemberContractAddress": "0x00fee6C991E6e31ecF047FbD5A9E5907Ac94B33D",
  "treasuryContractAddress": "0x589354c368235ceDB2bf55E0991ceDB5c4Fa78b5",
  "x2EarnAppsContractAddress": "0xEfA8f4489611487C09eD39E5b1d6EE285aE40942",
  "x2EarnRewardsPoolContractAddress": "0x075c6C377F7c65b9B72be6744153aC28B432Be5D",
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