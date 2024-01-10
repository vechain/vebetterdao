import { Config } from "." 
 export const localConfig: Config = {
  "b3trContractAddress": "0x02563E04a7F3432906033B1830812fBe126Cf0f8",
  "vot3ContractAddress": "0xcFEE91C0169498cDEb707fE721b31abC49DDeBd4",
  "governorContractAddress": "0x43645A6211Fa327D427e518C1Fb51DC7B4aC8a84",
  "timelockContractAddress": "0x431944ff57e0eac749C83985043F1Cb419043236",
  "nodeUrl": "http://localhost:8669",
  "network": {
    "id": "solo",
    "name": "solo",
    "type": "solo",
    "defaultNet": true,
    "urls": [
      "http://localhost:8669"
    ],
    "explorerUrl": "https://explore-testnet.vechain.org",
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
}