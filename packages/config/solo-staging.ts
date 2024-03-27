import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xBBB5556C40189647165B23e34f4f14731202c711",
  "vot3ContractAddress": "0x3ba25579E97Ff38F10a899adF4818e6D401AeE92",
  "b3trGovernorAddress": "0xD94c594C42b352c11dAaa17e2a93BeF98fA2CDe6",
  "timelockContractAddress": "0x053A8794Bd1e2DC8466814CF946FE2F09407Ba51",
  "xAllocationPoolContractAddress": "0x5d5345a2A92A259CB5C3EB6bA0305e83594cDD17",
  "xAllocationVotingContractAddress": "0x20F1D24F010c54E75df72D7AF5bBedf9ED0cF267",
  "emissionsContractAddress": "0xCC6ce9df1b0B228F43ad55ffb174b08806ae8487",
  "voterRewardsContractAddress": "0xAb01f68A6367Db12B305725e2DAAA2F520fB8c73",
  "nftBadgeContractAddress": "0x59dc528E7057B60D6147429F389a2B6e3e906a9C",
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