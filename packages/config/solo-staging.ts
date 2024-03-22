import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x6b0620dFc9cA604d8986256395d3048012a5C5F1",
  "vot3ContractAddress": "0x6fCA26087934d3217BB5A0d5a91754124f91d840",
  "b3trGovernorAddress": "0xa70781Dea2f00B13B36450Ae080B27F8e8FDFb9b",
  "timelockContractAddress": "0xAb75e0D56007c48e894350A9A41D2AbE8EfBB0cC",
  "xAllocationPoolContractAddress": "0x46373d4dA805cD3fCCc0968Aa1Db65B6bCF3c463",
  "xAllocationVotingContractAddress": "0xA8152FBE7754d133aCF186A94bd857728AAb2b11",
  "emissionsContractAddress": "0x441D458d277120fd2BB2E1f3a32f4Cc2496d0526",
  "voterRewardsContractAddress": "0xb0342d1Ba17F72047E14AcdF231A5ABe082cCD19",
  "nftBadgeContractAddress": "0xcF2232845dc99E38c3f675E2Fb694A81E60DcB9E",
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