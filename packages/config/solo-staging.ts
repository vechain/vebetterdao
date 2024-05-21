import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x8C3cC30DdEc55B9C8e80BcB9CDa40e13e81136D6",
  "vot3ContractAddress": "0xFd5455e40E5378930050bD36D35BF52282439f14",
  "b3trGovernorAddress": "0x2E6AB96D47fECeC1688Fb3F255A2Fa3813Fae6F9",
  "timelockContractAddress": "0x1839C8dC6e16b82e3E93De12fD8123F3e19FAf9b",
  "xAllocationPoolContractAddress": "0x98689a154282ab3BaB8371675036DB2aC58967ce",
  "xAllocationVotingContractAddress": "0xA5F8E0226891cB4EC431944e4E63d3A627F14E75",
  "emissionsContractAddress": "0x6057A1E42dE85F05068F4426562E864D6c9f2C40",
  "voterRewardsContractAddress": "0xC088541d69aA3133cD3d147F2B64829F3b7D23Ed",
  "galaxyMemberContractAddress": "0x5957502Ec4672352C4D3CE631070BdDB922301c8",
  "treasuryContractAddress": "0x5794cd994134F27399447ECa5B0A4A6d9237125C",
  "x2EarnAppsContractAddress": "0x764FE234B3Bea69f51a448eE43048e581D968Fed",
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