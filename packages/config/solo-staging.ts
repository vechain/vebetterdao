import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xc8aD228aa1438F8DD1c966F91b3DF0496Be5A76E",
  "vot3ContractAddress": "0x3E46D24C191E66232c5D5a2bDa9ef46a2418aEA7",
  "b3trGovernorAddress": "0xB5396b7D6f4Dd26448f7852ffe19ded6c95b8BAd",
  "timelockContractAddress": "0xc756fd4EcA58a5D534B52E0Dc2eC2c24da4765b8",
  "xAllocationPoolContractAddress": "0x1b54BD7416784cDEE78ebC48D701e475F48ef54D",
  "xAllocationVotingContractAddress": "0xC5ecaCd52EDeb8Ae11f6f577df064714f1D918Ad",
  "emissionsContractAddress": "0xBC2499aA72D5b58eb86c0334cff04b11592693BA",
  "voterRewardsContractAddress": "0xB5bb5cfb77B956503D7984132413Dd18E849Ea67",
  "nftBadgeContractAddress": "0x77eecb2432e6373bEe76E0579D27aD75A4481964",
  "mixPanelProjectToken": "e03f4f5f6a753dae2dac30a69dfe21f7",
  "nodeUrl": "https://thor-solo.dev.b3tr.vechain.org/",
  "network": {
    "id": "solo-staging",
    "name": "solo-staging",
    "type": "solo",
    "defaultNet": true,
    "urls": [
      "https://thor-solo.dev.b3tr.vechain.org/"
    ],
    "explorerUrl": "https://insight.dev.b3tr.vechain.org/#/solo/",
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