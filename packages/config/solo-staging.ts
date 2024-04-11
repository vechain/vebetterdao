import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xab3836ac688E10Db2eC0893D6b4E111A18fc430A",
  "vot3ContractAddress": "0x8123BC3078840bd6d5df8Bd4EDBb5EB62C58BA2a",
  "b3trGovernorAddress": "0x7980F77Fe7f370CB7F322651D4beD7b0cFD28F91",
  "timelockContractAddress": "0x7010Bc41B7eBBC5e21De4A63212CEcd6558508eB",
  "xAllocationPoolContractAddress": "0x7e6748cD03003FFb673D7a1d7856f8797C66105b",
  "xAllocationVotingContractAddress": "0x6743f5C5EC15600EAbCbdAAbA339cda51Ed882a1",
  "emissionsContractAddress": "0xbc711947A45dF36D5e3cC663c61908EfE64c8E85",
  "voterRewardsContractAddress": "0xD264ddfD44aa32599B6f18d4DA956F6AF3058dB7",
  "nftBadgeContractAddress": "0xFF33a61B9163949ceB34d321Fc5AddACdA70f81d",
  "treasuryContractAddress": "0xa7DC20D3282Cf786898a8232cF2e82B2913bA116",
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