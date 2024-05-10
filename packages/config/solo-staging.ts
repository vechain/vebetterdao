import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xbbA9E49Faaf04bD9834eE4bD3846b345450ea898",
  "vot3ContractAddress": "0xc5e7815083A6d981b565cf6c2b8f5204AF9dfA9d",
  "b3trGovernorAddress": "0x974cb891b26d670a6F574b38C01CE7667207EbbA",
  "timelockContractAddress": "0x032Ed7D6024430988e6B69C008D9d6eec1284AdC",
  "xAllocationPoolContractAddress": "0xAe8968EEdDB8a18532a6d941376D31Cb90A60d31",
  "xAllocationVotingContractAddress": "0xaEF861A498A6aB5ad74a30Dc31A367419636a242",
  "emissionsContractAddress": "0x10F3d21EE9066fAA04a580348a06bE9Af96d4E10",
  "voterRewardsContractAddress": "0x17F3447A313cCF78c2f00F0C1f624B6A7Aac3Ab2",
  "galaxyMemberContractAddress": "0x71b6CdBC7528932c42638b0D3238DE1E750eaD24",
  "treasuryContractAddress": "0xf1317176D071eCe845968f28F90Ff905E09e0274",
  "x2EarnAppsContractAddress": "0x933f26CECe6ad50dD8131cFe8b075f38A7416Be3",
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