import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x5E2F668c5590EA93A7f77DA9991589Bb04b22c5B",
  "vot3ContractAddress": "0xC2431432B299D70588A26933b4d45374dB01981e",
  "b3trGovernorAddress": "0x670BeeF41F2f47362D8038572C7E9d35Ccb7040b",
  "timelockContractAddress": "0x6d56A5Eab062392574622F510dc5EEFFe75d069C",
  "xAllocationPoolContractAddress": "0x487C0211bfe7DF8419C14D92bD0ccEBEec7c1002",
  "xAllocationVotingContractAddress": "0xac31cA7157c79Aa6A752D55c70b91dFb0dEe2Bad",
  "emissionsContractAddress": "0x9D2FE4d6f2d77827a53A0293a92740Ad13d0c2d6",
  "voterRewardsContractAddress": "0xD1ceE87e38124767D42a82e414a02948b42a5B10",
  "galaxyMemberContractAddress": "0xD4B7e5eA3575079A383Cb3aa4aEE70C17703a02d",
  "treasuryContractAddress": "0xaCd468b81f45c36b9852b2B9aE1D5236e23065dD",
  "x2EarnAppsContractAddress": "0xd06B59e46f3dE4c980cc4fE29DD9A6f33FbA2075",
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