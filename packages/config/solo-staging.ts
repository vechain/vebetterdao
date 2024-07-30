import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "solo-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "ipfsPinningService": "https://api.dev.gateway-proxy.vechain.org/api/v1/pinning/pinFileToIPFS",
  "ipfsFetchingService": "https://api.dev.gateway-proxy.vechain.org/ipfs",
  "b3trContractAddress": "0xf7CE035AE5c908958Fe3f0a8fd2EDa70feD0b9c3",
  "vot3ContractAddress": "0x1DBb783411928B1Af58dFd8d3dFd8BaD70534817",
  "b3trGovernorAddress": "0x065D8B6f28CC69432877F3fE0a75EaaD39B8B11c",
  "timelockContractAddress": "0xcC653a739b593B589d8cb0acca143c300d37ac3E",
  "xAllocationPoolContractAddress": "0x569fc3E901b9CEF0e9F8B53A5473720d89F8e694",
  "xAllocationVotingContractAddress": "0x4A062A0B087bB59A6748ac77f84b4f421a8C019d",
  "emissionsContractAddress": "0x0F65095f196CA80bC32696308D145235b125dDcD",
  "voterRewardsContractAddress": "0x8b7ecD65C97766743Bf762F760F85a1AFdB62AC1",
  "galaxyMemberContractAddress": "0x004c0a284A29b653196d433aebBaB2E3f6746fB5",
  "treasuryContractAddress": "0x8947Ebf9BEE472Da04F878b3f84388813525dAD8",
  "x2EarnAppsContractAddress": "0x02F39E13D596B16D28878d7B01C0d17816D67107",
  "x2EarnRewardsPoolContractAddress": "0x8451F656c4c9A22b7aDF9AcDFda3013E170be2D0",
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