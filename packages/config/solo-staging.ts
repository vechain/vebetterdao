import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xaB185644ceB686391997b8B73683030f305C44b2",
  "vot3ContractAddress": "0x24f523a734A3aC732297A5ECe579dbf8Df18A1c4",
  "b3trGovernorAddress": "0x9935b27D2B7915b95670660a6A76E0A87Af5b2e7",
  "timelockContractAddress": "0xD9b25FA16c3355DF5E32f526fcE1F654e2A9076f",
  "xAllocationPoolContractAddress": "0xaa01b492aA3165a57a0F60657C68f6FA186FC76f",
  "xAllocationVotingContractAddress": "0xcEA501642A027bc01149E3B9C78e1C4dCe5f109d",
  "emissionsContractAddress": "0x0E341A18B8a40ED8243cCCF39BdaA0c3D7f8A450",
  "voterRewardsContractAddress": "0xfdB71801Db8b81332A263fd6BA31D1dE23eC97EC",
  "nftBadgeContractAddress": "0x3BC1296C0Ba7E5400B90aBadC47978Cb958Eb460",
  "mixPanelProjectToken": "e03f4f5f6a753dae2dac30a69dfe21f7",
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