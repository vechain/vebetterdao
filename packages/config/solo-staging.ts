import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xb92d81B1705f04E6084e7CcE51c1fAF872d90bcD",
  "vot3ContractAddress": "0x832Cb94849B7Ab86A08972718F4FedAef37b7D02",
  "b3trGovernorAddress": "0x9CEa9D3aF71e8d9557716110281cD4e629FDbfC8",
  "timelockContractAddress": "0x642566D11F5AfCC09e220461c47587dfC46Af6E2",
  "xAllocationPoolContractAddress": "0x9eedd234A8Cef8345065b31985E6D92462dBDFCA",
  "xAllocationVotingContractAddress": "0xb0249a3781CDd00C4D4B08Be6cC37f2aD31F7ea4",
  "emissionsContractAddress": "0xfEA38a5629995634117650Ab11EFba81a7B17015",
  "voterRewardsContractAddress": "0x6a1034Aaa117584cb7f9698342D8169417EDE57B",
  "galaxyMemberContractAddress": "0x2714d9e7f0402D967f88c0BE6dfBF09d9295128d",
  "treasuryContractAddress": "0xe0fC07Fe25f873bc71699e1e3d9545FDEB630ED9",
  "x2EarnAppsContractAddress": "0x2725598523794d13725d053dF7fFEfea604cCdcd",
  "x2EarnRewardsPoolContractAddress": "0x36ccb7d5d877D3Ee48F06e2b63a59766c2Db01FC",
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