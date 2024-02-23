import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0xf3475E3702a67c89c7b3bf51E215461cFED209da",
  "vot3ContractAddress": "0x5b41CE1444f3a913C05ab283E6E37eF3e7b03078",
  "b3trGovernorAddress": "0x43b89a2b359cC3E096f30AB13B9ECAa583f12DAb",
  "timelockContractAddress": "0x7A582B82f28C9b889CA89e57cA64DC79384980E9",
  "xAllocationPoolContractAddress": "0x0baf9b0526616ba6D2e676B05E0288E9a48E0356",
  "xAllocationVotingContractAddress": "0x57FaAA5611e04dAf7c791Dc80D6eaC0D21E36A58",
  "emissionsContractAddress": "0x3934b6d8326d1d705E7aBEa8834B0Fe4fdA2cdBA",
  "voterRewardsContractAddress": "0x1F9D50adcF43200b40489087b804cB68E0088EEA",
  "nftBadgeContractAddress": "0xf2cB28D9c9e7F8B589C2BB8849953090d91c9784",
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