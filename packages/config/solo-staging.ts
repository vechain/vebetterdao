import { AppConfig } from "." 
 const config: AppConfig = {
  "basePath": "https://b3tr-frontend.vercel.app",
  "b3trContractAddress": "0xec6f8F03BEdc69b442a1F53cFB3e654f69f0c92d",
  "vot3ContractAddress": "0xdf084951Ce9544cc0704A9db9ad120CEA724Fa14",
  "b3trGovernorAddress": "0xF12Ab54F0d12Def3814c859ec55Ff850A0466a48",
  "timelockContractAddress": "0x5A11F01eC6aD617b329Ad5b855B9CDee32bd656e",
  "xAllocationPoolContractAddress": "0x1cAefECbDD4a37ABEEd1B887137D34448f2fDe5C",
  "xAllocationVotingContractAddress": "0x8bb35b4D237F8BeCB1D78d760EC4aa71aC8B4C12",
  "emissionsContractAddress": "0xEb925d452e0A254B9809eECB3802f2F05Ef86Be5",
  "voterRewardsContractAddress": "0x76F386bB2629538881D352daefc8Ea74417AF520",
  "nftBadgeContractAddress": "0x3124058D6AF870053dD305dd3eb01643B7cF73a7",
  "treasuryContractAddress": "0x749d534358df5eB37f090C0E6190337D76bC0200",
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