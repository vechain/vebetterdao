import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xee7627A3bb387daFeA35AAf5C4d4643Da0ef42A6",
  "vot3ContractAddress": "0x18F9680b40909EB2241dC35d6767E91081c999b0",
  "b3trGovernorAddress": "0x4c50b5B726fFe317D113F17B20E75f53CD61338b",
  "timelockContractAddress": "0x8aD6a685B9E091677E6e506878b5AA8FAB2D3830",
  "xAllocationPoolContractAddress": "0x92bb3cEe25Bc9D68BAE824CE70787e6c34777631",
  "xAllocationVotingContractAddress": "0x14b47D1e919365aE630fdC934fd7869b03D57A73",
  "emissionsContractAddress": "0x4001887854F5D73E36265263B1765b239B41B9D4",
  "voterRewardsContractAddress": "0x5BCcCC6F4a83AB36d81125831A8BF5DB054eC94f",
  "nftBadgeContractAddress": "0xe20a5557EcfeED83C789421A4f3070caB8740405",
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