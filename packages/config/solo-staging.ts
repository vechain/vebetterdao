import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x7351B907366D89A15dfb2a082f62d88cCfE3EB6F",
  "vot3ContractAddress": "0x1Ac14E1C0223B226cE76c5aF85238674830177F4",
  "b3trGovernorAddress": "0x59f88e984c6e9eddC43eA6eeeD865C4Dc1E52821",
  "timelockContractAddress": "0x253971cF0FA6C74376447C1aC0e98Bd91D17F267",
  "xAllocationPoolContractAddress": "0x0f8a4DeF5848E9f08EDC16A3C36DE9C0De9eB3A5",
  "xAllocationVotingContractAddress": "0x746CA5dd08B70429A45c49F415c9C5C7AA9e2d8F",
  "emissionsContractAddress": "0xFBbEe552B6129aE52957B97bC48D9e49de2C6a29",
  "voterRewardsContractAddress": "0x9aC9bc0D5e22C5a33D431f0483a3e61cB1b735F6",
  "galaxyMemberContractAddress": "0x47359Dbb7a5E3FEd35e8D9957063Ec2F40B8aEEF",
  "treasuryContractAddress": "0x3a39eD172EF2783a2678e33e1ca823EB5feD9217",
  "x2EarnAppsContractAddress": "0x1E13B8F411EE834e7CFd3eD5A3Bf42Ad77a45181",
  "x2EarnRewardsPoolContractAddress": "0x4Ffa4C90a478A92F4a47Df0d4FDa5D25D6ba796f",
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