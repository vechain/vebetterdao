import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xF983C898bAb7975e05Eee992a1e42755eFEe2920",
  "vot3ContractAddress": "0x764b822B36b4EB2F9498B8A65839583606D38427",
  "b3trGovernorAddress": "0x102483a3B39E9EaC7583Aab62B3a3574EC1413e1",
  "timelockContractAddress": "0xD5932Ea5D44A2cC18A6255fa303C91C3Ffa3e908",
  "xAllocationPoolContractAddress": "0xe13C3b491Ff799B1AB8cA4654e6414E736Ae6a59",
  "xAllocationVotingContractAddress": "0x0C299bd858D66a4e9e752bE820A6688BA74177f3",
  "emissionsContractAddress": "0xe0aF1d70c6Cfb06279E16F2c0eC53744365A4eB7",
  "voterRewardsContractAddress": "0x834A41F1515Fa21982cd7d75052bF7e4D8CA2BCC",
  "galaxyMemberContractAddress": "0x5b1D7A3138C8F28A7043Dd767A301b46090fe689",
  "treasuryContractAddress": "0xf399AC946E99Df0b1B96288A513AB778e3676343",
  "x2EarnAppsContractAddress": "0xEc9A65601565ae03730bDCa91a101161Cc30A3e3",
  "x2EarnRewardsPoolContractAddress": "0xD8778e3eBE8B86BA3edE6De33dd36454A1913F4b",
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