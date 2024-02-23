import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0x19feFcBe65e61E5F2dB040892853c2d3B5a18dC3",
  "vot3ContractAddress": "0xA3AfE7C89Da7224ecD315FEDb07B229Bee54B7F3",
  "b3trGovernorAddress": "0x229aF4df12C2863Fa65431434ddF9deFc50694fF",
  "timelockContractAddress": "0x3eD5bb1e56cdB0946abf48F542daB81b4b109867",
  "xAllocationPoolContractAddress": "0xfB96556fE67735b757Bacdcfb582956DF80d996E",
  "xAllocationVotingContractAddress": "0x4e401F7b83f25c87bE926B3Ac0395EE481D53Ef3",
  "emissionsContractAddress": "0x263e941f9DE82106ef9a34934dAECEB19D97380f",
  "voterRewardsContractAddress": "0x232638Bc5A78a894B75976DebA94b204Cd697c43",
  "nftBadgeContractAddress": "0x7eFda727C73619c87ECdFdE769FB7a7178A7dA52",
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