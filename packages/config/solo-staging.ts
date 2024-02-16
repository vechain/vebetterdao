import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0x8D2F2f52cF53E36460497aE59B5F11a1cB2a28eF",
  "vot3ContractAddress": "0x9FFC0Ed8fe30422B63ff688A456c5779C89C7F1B",
  "b3trGovernorAddress": "0xd4a3b51e50907AA2957DC9b0A66B7bb5162fC950",
  "timelockContractAddress": "0x6ABfcb052F5805A7293B6D2f9dd9e1375E4D259F",
  "xAllocationPoolContractAddress": "0xB56Ea441E12f95E35945Ca1c9e666F8952350b1C",
  "xAllocationVotingContractAddress": "0xf15CCdFD9e7537a95a8FE536D2a98094193674B1",
  "emissionsContractAddress": "0x84cFCb5D0653E956e900a9E920E0A1fA2808bEcC",
  "voterRewardsContractAddress": "0x781F940CcB27c1bb6aCF719aD3c71b9ceb9E334d",
  "nftBadgeContractAddress": "0x6c4cB7B6d5693e6F94c445f296C83F2fC28b8e35",
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