import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x394B4ee916eDeb4E47bf0265eFD0969464B24f14",
  "vot3ContractAddress": "0x4d1d94baDd7d2A413c5744d812Eaa15Bd5ab2172",
  "b3trGovernorAddress": "0x2aC1C51f49390034c901e76c16f353a0b8C1220B",
  "timelockContractAddress": "0xBC67EF9257182f471C04D4F105AD619E748015Dd",
  "xAllocationPoolContractAddress": "0x8BB3B97753f33CBDd35a0E134d7AC98F50E14DBc",
  "xAllocationVotingContractAddress": "0x84eA4EA32A64D035b8c6CF1e4b808a5545C90716",
  "emissionsContractAddress": "0xCdc11A06F8028F9b36C740792Dd2f229854fe795",
  "voterRewardsContractAddress": "0x963Cc67fF3d588697568b219017Cc783262b79f0",
  "galaxyMemberContractAddress": "0x9C03249b951e87e8fAa56DA739F2C2E5B7a7CcBA",
  "treasuryContractAddress": "0xDdF90300BD0A184958B0BbA1e4d677a5be57d853",
  "x2EarnAppsContractAddress": "0x436926c4Dc35b59D90AA90d19247F296576b9E69",
  "x2EarnRewardsPoolContractAddress": "0x8069C1f6Ea5FB6673712E77aD3a10fCa40486e19",
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