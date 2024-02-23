import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0xb37AB225d60B46c713Ea735f067c1f30E21564B9",
  "vot3ContractAddress": "0x2D896C6a20794d17D69b96593A0A9fFa5627Bd61",
  "b3trGovernorAddress": "0x818E461C2255E6F6f3ab0c9d1262A1F472B584ec",
  "timelockContractAddress": "0x238A379fd6492B40Ed3D9352A9a0a043Eea21bEF",
  "xAllocationPoolContractAddress": "0x8D2B5a81570Fd29fd13c007B2cbCab55B6Cf5b42",
  "xAllocationVotingContractAddress": "0x3CEE3DDe21AA4b8A6369b9A9a32a8b3f291A1779",
  "emissionsContractAddress": "0xfEa513b10dFFF595C0243a814eb1f47c85045422",
  "voterRewardsContractAddress": "0x51e368398Dbae9f718ec83565B85532f55afcc82",
  "nftBadgeContractAddress": "0x15f02d60991f4c9e309463Dc407E415EC2A1EA2c",
  "nodeUrl": "https://thor-solo.dev.rewards.vechain.org",
  "network": {
    "id": "solo-staging",
    "name": "solo-staging",
    "type": "solo",
    "defaultNet": true,
    "urls": [
      "https://thor-solo.dev.rewards.vechain.org"
    ],
    "explorerUrl": "https://insights.dev.rewards.vechain.org/#/solo",
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