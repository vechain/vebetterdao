import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xEc2A7EF5d9bB6AA2764F066E0F880B710F7d6f04",
  "vot3ContractAddress": "0x8CAbC84FCa9E9056d128da7Cb6EA20b890DD9096",
  "b3trGovernorAddress": "0xE6C866CdC3E6a3F10819CA1220627C146EEb414D",
  "timelockContractAddress": "0x7b53eFb4dc87e207991483e34d78E9Bb12680FED",
  "xAllocationPoolContractAddress": "0x54ea0Fac647CeD8D01D38e730BBA63642160E88B",
  "xAllocationVotingContractAddress": "0x756D730FA1eA547431617FE041fA2343012F697F",
  "emissionsContractAddress": "0xD2e29aACC58907D6Fff8c270241B985Ec3F09490",
  "voterRewardsContractAddress": "0xD934b59ac19E5C74791EBBE72D61174c94372d9D",
  "galaxyMemberContractAddress": "0x536bE810767B0daAE58c58Ba36D57AD6E0686bb5",
  "treasuryContractAddress": "0xA2e78c1b483A13097F9ed2dbC6F33DF47128D9cb",
  "x2EarnAppsContractAddress": "0x89387d26e2383618f21504D01A4F845c93c42693",
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