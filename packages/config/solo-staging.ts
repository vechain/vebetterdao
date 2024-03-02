import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xad5EC4C3AdEa4CE884B115FbCAc7c070228662e1",
  "vot3ContractAddress": "0xA4f730596c41BBC34f84f62bf2B48F8C8d8d7724",
  "b3trGovernorAddress": "0xA841460eAc035cA5DF152aDba9445bd0755f4b93",
  "timelockContractAddress": "0x6446D87dBAb3EE7DA5F6e9e6c4e59Fa178D730e3",
  "xAllocationPoolContractAddress": "0x0B2a2cBAc8A7782F208DcA4f84b195746EA4cb24",
  "xAllocationVotingContractAddress": "0x0Eb250B063309767429b8EF64E8180c1C646A0E1",
  "emissionsContractAddress": "0xAE39f804206A99271F066dC3bd3401C9f72c74E0",
  "voterRewardsContractAddress": "0xaF16b84704d36eA164cd6A93caEC29ebF9b08E9A",
  "nftBadgeContractAddress": "0xC343f15a19495122E890efEb02F8d3f82C42feec",
  "mixPanelProjectToken": "e03f4f5f6a753dae2dac30a69dfe21f7",
  "nodeUrl": "https://thor-solo.dev.rewards.vechain.org",
  "network": {
    "id": "solo-staging",
    "name": "solo-staging",
    "type": "solo",
    "defaultNet": true,
    "urls": [
      "https://thor-solo.dev.rewards.vechain.org"
    ],
    "explorerUrl": "https://insights.dev.rewards.vechain.org/#/solo",
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