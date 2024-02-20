import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0x84Ab00E011eF4C5919cC3E761D0821966C0cBb19",
  "vot3ContractAddress": "0x9307119cb5F4033C05F64788829dE33b8015EC8f",
  "b3trGovernorAddress": "0x1274fCAA280f4BeEaD6ee98A893Dd02B233D4a81",
  "timelockContractAddress": "0x7d00f89fB3729Af5f0A0DbBB984e890a04c70D29",
  "xAllocationPoolContractAddress": "0xAa4134Fb1Fa938FbFF1ebc8b231F0aAC53001923",
  "xAllocationVotingContractAddress": "0xE6Ebebf3D0e0f5Be7e3675d910a3d6915A25abCa",
  "emissionsContractAddress": "0xbaC101eBBC89114ECE622Bb01d17DB9671C669b7",
  "voterRewardsContractAddress": "0xE598eF799d6425228774aaA252eD5ACb04A7A30E",
  "nftBadgeContractAddress": "0x2ca20cAa2A46271DD9BD85Bfcb5BD1bfE609683f",
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