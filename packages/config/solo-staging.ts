import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xc9aD67A3B765B78bd16bd72f08b7fb9523349a8E",
  "vot3ContractAddress": "0x0a5fe6E114e32225b7BDa24f9B444Db8D40aFf17",
  "b3trGovernorAddress": "0x7Ff4a4b785CD70C918ca356A9Ce77E58a09FFfd9",
  "timelockContractAddress": "0xBBbCBC1a3Db4529694Ad1e630afB2A9514C17A8A",
  "xAllocationPoolContractAddress": "0x278e030574c1E0a779DD76a2d8746e609a96c0AC",
  "xAllocationVotingContractAddress": "0xa230A2c881Cf35273A832748538cd7Ef3D09B294",
  "emissionsContractAddress": "0xF77d9c9AD307BAdcd68848FbAfF3167661639f98",
  "voterRewardsContractAddress": "0x98009d01f4C84320570824B0C653922FeC5A04a0",
  "galaxyMemberContractAddress": "0x57D80d39A1242D47F95964e0cAEE84fCF32e3dA8",
  "treasuryContractAddress": "0x4fF6924755382e5cFb21E753D6be2A5b0ce9F90a",
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
    "explorerUrl": "https://insight.dev.b3tr.vechain.org/#/solo",
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