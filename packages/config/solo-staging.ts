import { Config } from "." 
 const config: Config = {
  "b3trContractAddress": "0x5A7009ee9aEbCfD102d45094aE93e6C1e2eF9303",
  "vot3ContractAddress": "0xdF95A693E3BbfCA66dB613Cc961E2af3B902A9eD",
  "governorContractAddress": "0x660bB2ce6e4318F954be295e0EB705cDf6A52819",
  "timelockContractAddress": "0x50E18Dc4B48443086b1A3D8907730E8B16125b80",
  "xAllocationPoolContractAddress": "0x894200D14f130572f535827684B27bF5a0d851Bf",
  "xAllocationVotingContractAddress": "0x385eCD5C899C6B73c7261d1B0746CDCBD05AE352",
  "emissionsContractAddress": "0x0fe85F5d633ab4Cf5Df112e89fA097A955BeA848",
  "voterRewardsContractAddress": "0xD730E38087ea8Fb9Fc94B0D7Df6B2BfF17fCe76a",
  "nftBadgeContractAddress": "0x89c0e7626c71abD6d2C4eff99e7e79Ef27672B46",
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