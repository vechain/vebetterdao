import { AppConfig } from "." 
 const config: AppConfig = {
  "environment": "testnet-staging",
  "basePath": "https://b3tr-frontend.vercel.app",
  "ipfsPinningService": "https://api.dev.gateway-proxy.vechain.org/api/v1/pinning/pinFileToIPFS",
  "ipfsFetchingService": "https://api.dev.gateway-proxy.vechain.org/ipfs",
  "b3trContractAddress": "0x4fC2deBC3BC4Cd0bDCB679Dee0F0A91a790EfcF9",
  "vot3ContractAddress": "0xb6fc27746174b60517bD6701fE33C3882621Acd4",
  "b3trGovernorAddress": "0x93570FcAc44b1d78e25a8136E7a10359A5E71598",
  "timelockContractAddress": "0xdB86366479848563Df26C1569a59327D6850bc3B",
  "xAllocationPoolContractAddress": "0x47560773eD23cE624c07Fae40e3339a33F045208",
  "xAllocationVotingContractAddress": "0xa9FcC8F099E498AccB457b4F79c0d68402680C8a",
  "emissionsContractAddress": "0x4E986Faa6a53F697974F82526ae75604b69d39d9",
  "voterRewardsContractAddress": "0x5E0730E4a35f097D1da697D308C76ABBE083F74c",
  "galaxyMemberContractAddress": "0x3cCB82Ba2655Cc7b4A11C2Dfc60cAA297566Bd18",
  "treasuryContractAddress": "0xE882A839f3a7D1b6f1834C51Fbe4331dbb486CE5",
  "x2EarnAppsContractAddress": "0x6dD00DeC1044f2Ca1ecAee90cd15Bc7729491e1E",
  "x2EarnRewardsPoolContractAddress": "0x83c10D36EB2DfCFf4671dcFC1E347dF80341Bf5A",
  "nodeManagementContractAddress": "0xaE92eb53F68E4594ff32c9F586AC5F718404B58D",
  "mixPanelProjectToken": "e03f4f5f6a753dae2dac30a69dfe21f7",
  "nodeUrl": "https://testnet.vechain.org",
  "network": {
    "id": "testnet",
    "name": "testnet",
    "type": "test",
    "defaultNet": true,
    "urls": [
      "https://testnet.vechain.org",
      "https://vethor-node-test.vechaindev.com",
      "https://sync-testnet.veblocks.net",
      "https://testnet.vecha.in"
    ],
    "explorerUrl": "https://insight.vecha.in/#/test",
    "blockTime": 10000,
    "genesis": {
      "number": 0,
      "id": "0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127",
      "size": 170,
      "parentID": "0xffffffff00000000000000000000000000000000000000000000000000000000",
      "timestamp": 1530014400,
      "gasLimit": 10000000,
      "beneficiary": "0x0000000000000000000000000000000000000000",
      "gasUsed": 0,
      "totalScore": 0,
      "txsRoot": "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
      "txsFeatures": 0,
      "stateRoot": "0x4ec3af0acbad1ae467ad569337d2fe8576fe303928d35b8cdd91de47e9ac84bb",
      "receiptsRoot": "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
      "signer": "0x0000000000000000000000000000000000000000",
      "isTrunk": true,
      "transactions": []
    }
  },
  "b3trGovernorLibraries": {
    "governorClockLogicAddress": "0xA28640088F7Dd222C26227D56ea13F31E143F1B8",
    "governorConfiguratorAddress": "0x0eecc0e9b6aed6A2cBd58Ecc4711CA5a04968AdA",
    "governorDepositLogicAddress": "0x8a58d36FD80594f9e3D64ea7401621d787F62E30",
    "governorFunctionRestrictionsLogicAddress": "0xF34e302922A2064D29fB9590a247E33f7d372555",
    "governorProposalLogicAddressAddress": "0xF0Cf426a064Ed533cf655531a134C29B84b5f5FF",
    "governorQuorumLogicAddress": "0xE0aC2fcB88585Ee22B37e9e8058828a6Cdd25bc5",
    "governorStateLogicAddress": "0x36507E7fBe92D4Dd757e7CFB110AD1f7F09A5633",
    "governorVotesLogicAddress": "0xD03edccD90CFe05295DB7D5bc49477cD972A355e"
  },
  "veBetterPassportContractAddress": "0x2673C78E0e53154A363b41134774e242D6a2F7d3"
};
  export default config;