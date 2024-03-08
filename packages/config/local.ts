import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0x3567B1f71540dB4bC1d865a398BB3682F7497341",
  "vot3ContractAddress": "0x470D81A73771a00338F667B2F8c38Afd81F1385D",
  "b3trGovernorAddress": "0x0F28D21eF8C226b4522b17f8f7ecd74C4d384a24",
  "timelockContractAddress": "0xdAe1cA841f07769B352C1A6336f4Bea206ba81CB",
  "xAllocationPoolContractAddress": "0x6D67650d0c411D6C3329d74e61DB2686f03b2cd2",
  "xAllocationVotingContractAddress": "0x0E43451fa4134E322bc5E1A53D794E02948ef14A",
  "emissionsContractAddress": "0x973Af1Cb95182db7f937c242500A888D496aC737",
  "voterRewardsContractAddress": "0x7711DE0880Cd7E22af99E190Ec88a88F53CB0EFD",
  "nftBadgeContractAddress": "0x9D2e633381dfe450434b1bB33AaE24172E3955cc",
  "nodeUrl": "http://localhost:8669",
  "network": {
    "id": "solo",
    "name": "solo",
    "type": "solo",
    "defaultNet": true,
    "urls": [
      "http://localhost:8669"
    ],
    "explorerUrl": "https://explore-testnet.vechain.org",
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