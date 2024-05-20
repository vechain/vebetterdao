import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x6162a6Fc5f0c1E6624406f070107319075C4c4C1",
  "vot3ContractAddress": "0xD92552227E6dB4710b1bA12e87eF18c6e675020f",
  "b3trGovernorAddress": "0x3f94e46241139792abA1BC1831C2C625D9c381e3",
  "timelockContractAddress": "0x42BfadcD0eC021c7c3D7f4939C5B6269C57B70c5",
  "xAllocationPoolContractAddress": "0xA1698193f068A5E7dbBe3eD3f74Bc65CFa3Bb243",
  "xAllocationVotingContractAddress": "0xE3958dB6d70E37b75608d5EF740E765bcC36fbf3",
  "emissionsContractAddress": "0xea1C6cb26548197ebae9E3c28d762E89CA5685E2",
  "voterRewardsContractAddress": "0x39A0DF927Ff8512dbcC525c907C844e8Ed6C4Ea3",
  "nftBadgeContractAddress": "0xb3aE66C331bf6656174646ba0d14762657c9b0bA",
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