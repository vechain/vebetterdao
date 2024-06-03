import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x1CB6D091af80e326159D5AE7c24c99ef51fAF750",
  "vot3ContractAddress": "0x69C99D2e182be0046079B9113CC99Db6a19272D7",
  "b3trGovernorAddress": "0xC7D93e97C48993AF440B860E146F991fc62dEDdf",
  "timelockContractAddress": "0xC76C93d4D06153f0993c6844Fb411a1024FC4aE6",
  "xAllocationPoolContractAddress": "0x14425fdDC9ad6C8872c1D87F7567c91cdbECbfB8",
  "xAllocationVotingContractAddress": "0xc44fA8Fa3FD74B4a711a1ff5f8026eB4c39afe76",
  "emissionsContractAddress": "0xA974E2C125bEb5f89421F052d1f3A8D2966241F4",
  "voterRewardsContractAddress": "0x12fa175b9F6e7836ab5555D22355b5d6Ca674ad0",
  "galaxyMemberContractAddress": "0x988290941B5724eBBf28eb18aE4A48F1B18A18f7",
  "treasuryContractAddress": "0x1befA5Fb991250F17Cfbe273E0c25d63708e2E2B",
  "x2EarnAppsContractAddress": "0x5F4E66020107f4A97A5531C4FBeA714FF064827B",
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