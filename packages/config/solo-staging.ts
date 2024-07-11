import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0x9901F1d79D6206E7F7dD46D6b11b75EfbfEfb310",
  "vot3ContractAddress": "0x4224f56720109B61e42e4FB1fC32305fBA07BBcc",
  "b3trGovernorAddress": "0xC3DAa7eEb44A954848c0bB47577Cee3AB9BC66e1",
  "timelockContractAddress": "0x1Bb94c374B462A9043c70c37f97DCEd86b8F6232",
  "xAllocationPoolContractAddress": "0x426d46331b317BcC4F1a26D2F50Ffc1A7048398A",
  "xAllocationVotingContractAddress": "0x72510c05810aE0f072F6433D4C546794af0c6691",
  "emissionsContractAddress": "0x3c30e997d6a0D6F78dB633963e59C7F2d1557004",
  "voterRewardsContractAddress": "0x64dd90E8758918881a861062FB02c6e827cFc463",
  "galaxyMemberContractAddress": "0xe850a100DE9753FFd3196Bd4c1A97EdC8edE6A0A",
  "treasuryContractAddress": "0xFcdd66F69175a4bEe8f83433Ef2baC1495bAC5FB",
  "x2EarnAppsContractAddress": "0xfC5aCC87ABC62CabB563c31861E8B5f3102CB47e",
  "x2EarnRewardsPoolContractAddress": "0x0873c8242b8C46664c04b70de9e222Be4CdAfc81",
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