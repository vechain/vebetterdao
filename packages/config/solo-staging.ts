import { AppConfig } from "." 
 const config: AppConfig = {
  "b3trContractAddress": "0x863949F61169cA4a37F7f691FC682c5162B84F82",
  "vot3ContractAddress": "0x7f47e7D0fB2A7eA45fB7B354Ed234Dfa50FE882b",
  "b3trGovernorAddress": "0x231B83b80c427F33448baBF806308959cbb65e1b",
  "timelockContractAddress": "0xb0a4F4c2F456e725B39d24Cb52Beed579eA854a1",
  "xAllocationPoolContractAddress": "0xdaeB7306E344Dcbd11424B1C0176551796640B93",
  "xAllocationVotingContractAddress": "0xaF91C17BA9a805723a9CEf35b9C71BAa65c1D071",
  "emissionsContractAddress": "0xaf911ca783512338cEBF25F00a0EfaBe446cff60",
  "voterRewardsContractAddress": "0x60Fa556c3836716F8b14CBaE92E93B43BBE7A344",
  "nftBadgeContractAddress": "0xE39df00bc1F01aA891D26BC2cfAf9DB1Aac3D02a",
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