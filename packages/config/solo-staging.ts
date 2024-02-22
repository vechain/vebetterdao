import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0xf074304c7745bCd9edf29429DC13c8484F01373A",
  "vot3ContractAddress": "0xAaeE129a91195f83518734b8f58A86d5e851c7FB",
  "b3trGovernorAddress": "0x085C6f548e97eaDDd392aEB1812b8e72868D22D3",
  "timelockContractAddress": "0xF2E9a669181D06c51b0b32AB907DdEd1C6aCD0f4",
  "xAllocationPoolContractAddress": "0x3ac4cf24C59893aDE8095f5f4a7A9634124f7718",
  "xAllocationVotingContractAddress": "0x06413e1dd9BAa10dB9e146EC0e661aB0E3311A71",
  "emissionsContractAddress": "0x87dcfA5965370e9845b59d4980901F787368f7D1",
  "voterRewardsContractAddress": "0x27647533Cb0AC756C1db8670a465ad405B06C611",
  "nftBadgeContractAddress": "0xEeaa96c60AF33D03c3CAA57ee860351E29a83646",
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