import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x8E79560DF1B3b76c118B0938b0ec98595E576E12",
  "vot3ContractAddress": "0x3Ec33F39EA404c594669470EEd1182f4Ff88358D",
  "b3trGovernorAddress": "0xF14F391cc21a82d6d9b7b2aFbE7F84B3817eEa54",
  "timelockContractAddress": "0xD4c50DdA2E27Ff019b282BE1202930864e90A5bf",
  "xAllocationPoolContractAddress": "0x96429A7b56C8a2ee3a9f8b105e23FF20e7393Dc7",
  "xAllocationVotingContractAddress": "0x3f51fea486FacCE8Ce2F5f5b02DcadCc5936b6a9",
  "emissionsContractAddress": "0x1A9199Ea76CbBEf062c3ADed68B807026a201c6C",
  "voterRewardsContractAddress": "0xEa4FD405Da2599e6e64F263e2a51f78C8D57e876",
  "galaxyMemberContractAddress": "0xBAa1b194Af1FB86c0420d9686813Da0fE7b73D53",
  "treasuryContractAddress": "0x394413DA4e0d8D1791Fa4a3f812bee97d142590B",
  "x2EarnAppsContractAddress": "0x3767A1d9616D91c351C71458771f230c495BD4c8",
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