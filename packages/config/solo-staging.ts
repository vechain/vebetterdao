import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xf399dF43B0652C93318e906a4afAFF83494F74b9",
  "vot3ContractAddress": "0x9d5c14ca035d08EFcFd29C2b5953842947e3863b",
  "b3trGovernorAddress": "0xD5f291Ced0993D8002AA28cAfF71a73704225956",
  "timelockContractAddress": "0xfb08fB3Cd67fda1e8Dd3a6EcaBAA393d6c2db25D",
  "xAllocationPoolContractAddress": "0xbDd4EAFA83DF2Ac4A3D94b3992F199bBAD91D5B0",
  "xAllocationVotingContractAddress": "0x4c53Ea0032fcc30672264F82452b901b826Fb40f",
  "emissionsContractAddress": "0xC0b4AD83dF2A2006C9a3079c567389dA317A13C1",
  "voterRewardsContractAddress": "0x163365f4aAd232CEC388Db86d60FD0b1cE29E64b",
  "nftBadgeContractAddress": "0x80C419D492D6D22c04E9992b7Ca65668c96A7ed9",
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