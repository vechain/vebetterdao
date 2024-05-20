import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xE8078C8B50A89FaD2bc237DF2C8a10145C505593",
  "vot3ContractAddress": "0xc9A12082b42016907938A8e7A44E6DA9ecbD6A84",
  "b3trGovernorAddress": "0xcCeF6b6DF9e4335c9484F891c4F47Fb0D7d613B5",
  "timelockContractAddress": "0xdD4Ad0092a5fF02a3711925f6d9A55155e8cf35f",
  "xAllocationPoolContractAddress": "0xe4CFF2C3ae2Ab1c20e9144dda1f82B452258a547",
  "xAllocationVotingContractAddress": "0x54e8fd6b1848208bdeD30cE50B0774EF68875365",
  "emissionsContractAddress": "0xA354B07c3973DfCB5Ff68496B315a8c582b3c36d",
  "voterRewardsContractAddress": "0x981AE3e037aE34062637D19c8AB31A305389927C",
  "nftBadgeContractAddress": "0x009e39D89CA5738721fd6f1Afc2E7ABbBbA497Ad",
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