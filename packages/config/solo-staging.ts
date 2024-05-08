import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xc24E6DFad54b147C3C9fEaA11FA688Fd3FB2710e",
  "vot3ContractAddress": "0xc72A02472aa3A056Bdc86137dB5e0b58aC511B97",
  "b3trGovernorAddress": "0xd832CF6Ef45CFC8C54b611A01858B71b87e08c98",
  "timelockContractAddress": "0x5978E4EE4De966BE246E4291C4CD722cC2af1b9a",
  "xAllocationPoolContractAddress": "0x9cF037e41bB948ADEEaF5a76A8E3E2c9b6b47Ff7",
  "xAllocationVotingContractAddress": "0xE953987Bcf89962f91d64CCB7bFE0ffc011FBc9d",
  "emissionsContractAddress": "0x1EFf5bFE832A0f25dC911e306A43C3427B86aD91",
  "voterRewardsContractAddress": "0xe67a2AC251F1c23A38faC7Bf6Ef93c7D50b95a5D",
  "galaxyMemberContractAddress": "0x897ab21651A3C96C5F0050134319AAFB9eeBd58D",
  "treasuryContractAddress": "0x6D8D9d5dab159512E2263EC8d503Ef3DfCE2CF88",
  "x2EarnAppsContractAddress": "0xDBd5C02B5073DA663b7AABC41562ee3507EcA47C",
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