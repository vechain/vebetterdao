import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x55d3A8478E828aeB48ff4C4AC7CC3096221C8B43",
  "vot3ContractAddress": "0xB58F551982A1C3d4b50EFAb247b9d44d3e6eF653",
  "b3trGovernorAddress": "0xfC74020C6bbe8b814D27203884dBD7Cd78952a39",
  "timelockContractAddress": "0x9D8A046946d8787E297DFc92F0F85731cb4DD8e2",
  "xAllocationPoolContractAddress": "0x71D42802b8770Fc5fDB7605C2c48e61cbEE43F9E",
  "xAllocationVotingContractAddress": "0x37DC2Ea6aC332c92d465c7E85A29d31199C82445",
  "emissionsContractAddress": "0x01704f05b7A34896939275aA7F55beA528836061",
  "voterRewardsContractAddress": "0xC29f18F169c97371344A9F8961104a085Cb00472",
  "galaxyMemberContractAddress": "0x8Bc1ef31485EF20095ee2b5330E7732249882c3b",
  "treasuryContractAddress": "0xC4aBDabdA64F0f0169fd189B26Df3D2519fC8837",
  "x2EarnAppsContractAddress": "0x40021e224A505Ac8Ec96c9324EfA80Ed3BFEae94",
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