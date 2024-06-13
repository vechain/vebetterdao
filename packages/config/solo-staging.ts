import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x73AEfEc406692b6C890a5597d05A01B0B5042B23",
  "vot3ContractAddress": "0x34D608906E7E910c7217F146f098A1545Bf91512",
  "b3trGovernorAddress": "0x2158B6e788f8CEE3BD904D75df6062F8Ef047e88",
  "timelockContractAddress": "0xD1F1c856C5E5df6Ecf09815c4B6499ba3F8f8a5B",
  "xAllocationPoolContractAddress": "0x64D5f25b839d2a7d585BB01d817674319Fa2bFAD",
  "xAllocationVotingContractAddress": "0xAc0F039e90A4E6f2DaAe476Df46f982AB5CF3427",
  "emissionsContractAddress": "0xe869C15C822134E86510E12E69C0188F301dd5C4",
  "voterRewardsContractAddress": "0xC74804A75388Daa21A92116261cc9248eCdaBF27",
  "galaxyMemberContractAddress": "0xd19350DCeDE526f422FE3D3AD5EAFC3A28bFC703",
  "treasuryContractAddress": "0x1A27FfE71C9c4887CD457631dCDbD2092a843c71",
  "x2EarnAppsContractAddress": "0xAf67Cc745dF5F5bF475902f0BD8D88312f6B8Df8",
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
