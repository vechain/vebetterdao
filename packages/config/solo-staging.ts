import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x6bDA17ff06b3Bf9867B284fBF69F5BaC282e3810",
  "vot3ContractAddress": "0x780f463764fd674b9257918F9F11e370233E08b1",
  "b3trGovernorAddress": "0xC68E3864072E96ACB58497517b0516e8D71797C1",
  "timelockContractAddress": "0x735BFF61C397d406159298c2d50f7839a63032E5",
  "xAllocationPoolContractAddress": "0xa6ED703aC2E871C9838b3196FE91c1653f6423e3",
  "xAllocationVotingContractAddress": "0x9c08f0DC2b5005E6176352C322829cDB949e6de7",
  "emissionsContractAddress": "0xA8466Cf39e1c10856A55672b132329A0d5668c00",
  "voterRewardsContractAddress": "0x475796261F592575e81Bf6a71DDa847DbD21F8d2",
  "galaxyMemberContractAddress": "0xfbffe6af5B1Fdb7D1013746F9D07636E0380befD",
  "treasuryContractAddress": "0x1c98598B739c6092B0F401931B941555f7bAebf5",
  "x2EarnAppsContractAddress": "0x42B00702a3285aa2Dc4C0Cf9fcA94aA955376d48",
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