import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x1adBb0C57dB141DAd18D9Dcdf1cf3824Ed7fb584",
  "vot3ContractAddress": "0x863ae4EE235B53515Ab4c04FE238bf9E2de7B883",
  "b3trGovernorAddress": "0x2a46C0ebb7a353F5e16D39a0C447f9c75627b862",
  "timelockContractAddress": "0xDD85D92917a70Cbf9e47a6D7155784fa77669808",
  "xAllocationPoolContractAddress": "0xeA4bf72cD12F1d22d7E72f2a96B8Bf11FA6E2825",
  "xAllocationVotingContractAddress": "0xf4291A0D12b7923c1Ba6C8b13EB846a1C62539e2",
  "emissionsContractAddress": "0xa662bc3E9A1AEe5AC16955A12819f4802e810A54",
  "voterRewardsContractAddress": "0x59aAfe1e839d04c026e4Ed9006146dDd3C6CDC22",
  "galaxyMemberContractAddress": "0x48538c88fe6f5413fb3f8B48fF1e4942F042Fa5E",
  "treasuryContractAddress": "0x6CA0e254B68874029d8040104618c55fD663317B",
  "x2EarnAppsContractAddress": "0x2a762aeA6B2cd5A6049f05d0EB4F9274013B3e98",
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