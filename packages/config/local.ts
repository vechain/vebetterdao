import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0x45218D4B346fAfC6193Dd73A9157Ed8302bB1b07",
  "vot3ContractAddress": "0x89aaF873945F03CA2a188457a920e4BD3823AF96",
  "b3trGovernorAddress": "0x87C4F4Bd77661237B7f869B8E12747E468822B37",
  "timelockContractAddress": "0x8b9E996E247A7bb64e6b63721d6B5BF23C6aE2b4",
  "xAllocationPoolContractAddress": "0x81B06a65e0B222D9C1Ede1B64cCA1aac60aC766e",
  "xAllocationVotingContractAddress": "0x1F2FBE10E1540a4D8eE3Cc82a91d8f8901AfA8b6",
  "emissionsContractAddress": "0xa86B120D9077f73B9608F5b421f8D0e6eB715dA1",
  "voterRewardsContractAddress": "0x6F805ebb4a39655612496ebDEAe956652c58c117",
  "nftBadgeContractAddress": "0x3268C8601644e9c3E2ca96E9D83cbcbfDf762366",
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