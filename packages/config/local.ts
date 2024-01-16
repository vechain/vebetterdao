import { Config } from "." 
 export const localConfig: Config = {
  "b3trContractAddress": "0xB9dB00CeC43E8870eCF3c227a032c17A16EAb3Af",
  "vot3ContractAddress": "0xA87A7B014a66d58807D3366e34Caccb52FC6c22D",
  "governorContractAddress": "0x125C4E8c6e073112AF993fE661A372135Af311f5",
  "timelockContractAddress": "0x8a39859bC737c6A602f8274B3BC79eC1f6fbe479",
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