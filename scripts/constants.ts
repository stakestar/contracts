import { Network } from "./types";
import { BigNumber } from "ethers";

export const ZERO = BigNumber.from(0);
export const ZERO_BYTES_STRING = "0x";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_PRIVATE_KEY =
  "0000000000000000000000000000000000000000000000000000000000000000";

export const ADDRESSES: Record<
  Network,
  {
    depositContract: string;
    ssvNetwork: string;
    ssvNetworkOwner: string;
    ssvNetworkViews: string;
    ssvToken: string;
    stakeStarOracle: string;
    stakeStarOracleStrict: string;
    stakeStarTreasury: string;
    stakeStarRegistry: string;
    sstarETH: string;
    starETH: string;
    withdrawalAddress: string;
    feeRecipient: string;
    mevRecipient: string;
    stakeStar: string;
    stakeStarBot: string;
    weth: string;
    swapRouter: string;
    quoter: string;
    pool: string;
    uniswapV3Provider: string;
    uniswapHelper: string;
    oracle1: string;
    oracle2: string;
    oracle3: string;
  }
> = {
  [Network.MAINNET]: {
    depositContract: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    ssvNetwork: "0xDD9BC35aE942eF0cFa76930954a156B3fF30a4E1",
    ssvNetworkOwner: "",
    ssvNetworkViews: "0xafE830B6Ee262ba11cce5F32fDCd760FFE6a66e4",
    ssvToken: "0x9D65fF81a3c488d585bBfb0Bfe3c7707c7917f54",
    stakeStarOracle: "",
    stakeStarOracleStrict: "0xd58F6D0d48C96001Eaab92ABE74438B9C3D5b79e",
    stakeStarTreasury: "0xd339Fef5b2b96E9B136781594BdaD19f29f10a4d",
    stakeStarRegistry: "0x8A205e13Ad79c56d7EB0acAF7c9636907caF7EeC",
    withdrawalAddress: "0x0dE24880db739A16c5037d1c0ca35c63b6e55421",
    feeRecipient: "0xF896969C094e2AA279C405db1B28Acef3aD38391",
    mevRecipient: "0xc6eAEF7a6Ecb8A62337287B2f59B9adae46E2a45",
    sstarETH: "0x74F0fd5eEFe001F1cD9e1D533A7daCd24aE9e690",
    starETH: "0x68f62F34DA70421f75c84f7af415b187baf27F6b",
    stakeStar: "0xCfbcdae56DdF447D4eea97B1Bf4F76b2d03d1061",
    stakeStarBot: "0xf62A72F5C9fd6Ef5E8fD632d1056210Dedf9a5b4",
    weth: "",
    swapRouter: "",
    quoter: "",
    pool: "",
    uniswapV3Provider: "",
    uniswapHelper: "",
    oracle1: "0x29047B784AB9680c3F79c6258bB5c490A21D9939",
    oracle2: "0xe949156Dcf5286e3d58806aCd50622d30B663dE0",
    oracle3: "0x6e0e14793ab9d472Ac4527f0719d2E35Bb1d0a5A",
  },
  [Network.GOERLI]: {
    depositContract: "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b",
    ssvNetwork: "0xC3CD9A0aE89Fff83b71b58b6512D43F8a41f363D",
    ssvNetworkOwner: "0xC564AF154621Ee8D0589758d535511aEc8f67b40",
    ssvNetworkViews: "0xAE2C84c48272F5a1746150ef333D5E5B51F68763",
    ssvToken: "0x3a9f01091C446bdE031E39ea8354647AFef091E7",
    stakeStarOracle: "0x5c0D534F56b90Fe84dF786127492D148dCBcd374",
    stakeStarOracleStrict: "0x8Fcf0b26f677833E62b199b92eFf9A48333b6639",
    stakeStarTreasury: "0x465bA808E1C0D696c98A13e7FBB5e426AEd657C4",
    stakeStarRegistry: "0x7a07CE5D40b01aafAc2B45032E4b84483b47aCAd",
    withdrawalAddress: "0x6119B6032c89e127C94a4C9A7537d2B664Fd7727",
    feeRecipient: "0x08E1778f5aCC3D6975d59deDB422d1A8F3826968",
    mevRecipient: "0xCc00D4D8040dB3db887aD58d23D4fDA41807e9FB",
    sstarETH: "0x9693Bb48FF70b8cda580248E57638Ed57843795B",
    starETH: "0x7a88ec04ee9e6e2047D3Dc4354bF0E009896EA13",
    stakeStar: "0x888d17064b32824eFfc843695ca60eA4Ca41Eb41",
    stakeStarBot: "0xFfa618ed01B71eC7dc5e11a1766bECb318567002",
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    pool: "0xa36230b9e599B9Cad2f11361c1534495D6d5d57A",
    uniswapV3Provider: "0x828FC61d4b5731C5B048b90F4371C0C6d8E7bab9",
    uniswapHelper: "0xD779C62738695388e26EE8d12984634805b2cC70",
    oracle1: "0x984333b719ff2e886F3d1c6cC605Ac7B99c24426",
    oracle2: "0x8c08a6Eff6B78D6c34ba54ac931d3af2eF42622b",
    oracle3: "0xe187820c0d57F93eCA3AE5678fED4e8470cc1867",
  },
  [Network.HARDHAT]: {
    depositContract: "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b",
    ssvNetwork: "0xC3CD9A0aE89Fff83b71b58b6512D43F8a41f363D",
    ssvNetworkOwner: "0xC564AF154621Ee8D0589758d535511aEc8f67b40",
    ssvNetworkViews: "0xAE2C84c48272F5a1746150ef333D5E5B51F68763",
    ssvToken: "0x3a9f01091C446bdE031E39ea8354647AFef091E7",
    stakeStarOracle: "",
    stakeStarOracleStrict: "",
    stakeStarTreasury: "",
    stakeStarRegistry: "",
    withdrawalAddress: "",
    feeRecipient: "",
    mevRecipient: "",
    sstarETH: "",
    starETH: "",
    stakeStar: "",
    stakeStarBot: "",
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    pool: "0xa36230b9e599B9Cad2f11361c1534495D6d5d57A",
    uniswapV3Provider: "",
    uniswapHelper: "",
    oracle1: "",
    oracle2: "",
    oracle3: "",
  },
};

export const EPOCHS: Record<Network, number> = {
  [Network.MAINNET]: 1606824023,
  [Network.GOERLI]: 1616508000,
  [Network.HARDHAT]: 1616508000,
};

export const OPERATOR_IDS: Record<Network, BigNumber[]> = {
  [Network.MAINNET]: [
    BigNumber.from(66),
    BigNumber.from(79),
    BigNumber.from(80),
    BigNumber.from(81),
  ],
  [Network.GOERLI]: [
    BigNumber.from(58),
    BigNumber.from(61),
    BigNumber.from(62),
    BigNumber.from(63),
  ],
  [Network.HARDHAT]: [
    BigNumber.from(1),
    BigNumber.from(2),
    BigNumber.from(3),
    BigNumber.from(4),
  ],
};

export const OPERATOR_PUBLIC_KEYS: Record<Network, string[]> = {
  [Network.MAINNET]: [],
  [Network.GOERLI]: [
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBM3paeDB3b1Z1WlJGYXdCZ01UbzAKRE1wS28zQXRkV3VvWnRnRExBWXJ4am9tZkJ1MklmYXJpeDVSN29laFFFZmVlaEoyM1R4NnFvcnRBbXNpK1hEZQpPVm9VK0RlOUZDVUQxQTY2WXVzUU1oSG4wR1daQjAvaHJlbDR2QWpRZ3FJbGRmL0Y4Rkd0KzlvQjR4ck5XTUIvCmRRRDB4WldUTElOejBNTjkwQWwyWDU4cHVjSkFvZEFzWVJPWFdwS3hjdC80MW0wckhpT2J5Y3hjREt6M3MxczQKMldjajlINWppbjArSTFvdWZrUHFrN1l2azUyS0lnaDdTWXFyS3NveXBidExIK2U0Nm5FdmJXa0xMajNZN29ZRApOaGJhQjJUc2hhTk9uNHQ2MXNVaU0ra0d0SnlvVXo5ZlJtZkQxVXFTTmtMem15QUxIR0w0TUNGeFk5UERVcDBDCjR3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBcGNvbWtELzZqZXNWM0doaitCNnAKNmpNelE4WTE0TE5KVFdRUzlaRy9KOGhWejg1Z2o1RFN1cnFMU25LdHZpRCsyWk5DUEtqaGxTOFlSck53UDd5RwpPcUg5NWVIS0JRN3BkSXNiN1IzQ2VYMnRsb29vMjN4Y2ZuNGN1ZjNoNXptd1VacTAvbFBUVncwV2xZS1NycHRXCkpYUmV3SW9hTExqTDlWNFM3YURiSS9YRDhSdFF4ZEoxWksyYlpmMXU2NUpvZXAzQURtTW1SRkQ5WkdVM3lmeUEKZFhZd20rRHU1RGI3Wng0NG45eUpuOGNpaEJUUGdJM3ZoNkw2bmJVUXVZQVZVYmxVRkt0M2I0N0JRV3VyRjJPSApWeW9nMW5kU1ZldmNnSHNRMzBmOEFVbWRQT3lyWmJVcVY0NHcyZytyajg1MG1DcmNucUw1SDduTmpuc3FxR3pyCkJ3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBeVhQdEZIVHd3ZUJod2hQWW41MGQKdzYwOGQrdXRHeDBRQXNLRUxQYkdkalZMS1M4TklHL3h2NW1KNEV6NFNjdUVKM09VeVF6SUdDQzRUYnB4WWJpdgpXcmJ5VGc4d0R1QnBGeHRYTDBVN2xxTGlFS1liNk41NjBHL2NhTWNMNDA3VUh3U0FsTnQ5MzZtRUxqQXdFc1ZqCklEa1d3cXJUczJSd2pJUFVUdG5ud3k5d2tyem5mUHd3alZzeTA3c3E3MjVZS2RZbG9NWVZSN21sUzJIY3NLWGoKcnA3eU5aQXJhcXBta0x4djAza0NBTWRWYitsSWo3WkZBVmgwNEJSU2Yzakd2ekdZbW1LZ2FkcTcyQ2ZXeEJESQpVUnBLWUp2YmZFSldST1VDRW9pRUppTjI0c3AvY2o3enB2SmpJV3hCckdpL3l1UEZ1UjcyV201bzFoTnNiMndBClJRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBcm85QVpoL0xZaVNLMzFKUVJQeUIKbDVGaUpuUDlYaGMrMW1URWdLYmpSbitRak8yR05HTU9sbFd5eExKaFV2b2N4QkoySzVWSjQwMGhIV1AwK1FVdgpxU2FqVm0xdTcyZmE5eDR2aDNvZEwyN3l6RUdwMmUzbXhTR1pJL3g1ZkU5UWxsNlFpQWp3NHFRdXVrODFjVkIwCkk2T21GM0ozSW4zMlVlTitNaExPcXhtWXYvUGg2TERoSHlEVGFnRmk2b3MwOWZJYmpHNHVNR05HRzN3TWJoTVAKblBqZWVLeElGNFFQQXFuQzh5WUFUbEpsZ2JFdVpWbHpEcWNOeExLaU11NTFzL2NNT2lHZnBDU1VZcXFzL05Tcgo3VFFqMnhzUWZiVWh1ODZTeFZvOHRQUzd2U09BT25OMU41TnQxQ3dzVU9SdlBuY21tOG5GeGhMMnI3RkJNcVgwCkh3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
  ],
  [Network.HARDHAT]: [
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBM3paeDB3b1Z1WlJGYXdCZ01UbzAKRE1wS28zQXRkV3VvWnRnRExBWXJ4am9tZkJ1MklmYXJpeDVSN29laFFFZmVlaEoyM1R4NnFvcnRBbXNpK1hEZQpPVm9VK0RlOUZDVUQxQTY2WXVzUU1oSG4wR1daQjAvaHJlbDR2QWpRZ3FJbGRmL0Y4Rkd0KzlvQjR4ck5XTUIvCmRRRDB4WldUTElOejBNTjkwQWwyWDU4cHVjSkFvZEFzWVJPWFdwS3hjdC80MW0wckhpT2J5Y3hjREt6M3MxczQKMldjajlINWppbjArSTFvdWZrUHFrN1l2azUyS0lnaDdTWXFyS3NveXBidExIK2U0Nm5FdmJXa0xMajNZN29ZRApOaGJhQjJUc2hhTk9uNHQ2MXNVaU0ra0d0SnlvVXo5ZlJtZkQxVXFTTmtMem15QUxIR0w0TUNGeFk5UERVcDBDCjR3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBcGNvbWtELzZqZXNWM0doaitCNnAKNmpNelE4WTE0TE5KVFdRUzlaRy9KOGhWejg1Z2o1RFN1cnFMU25LdHZpRCsyWk5DUEtqaGxTOFlSck53UDd5RwpPcUg5NWVIS0JRN3BkSXNiN1IzQ2VYMnRsb29vMjN4Y2ZuNGN1ZjNoNXptd1VacTAvbFBUVncwV2xZS1NycHRXCkpYUmV3SW9hTExqTDlWNFM3YURiSS9YRDhSdFF4ZEoxWksyYlpmMXU2NUpvZXAzQURtTW1SRkQ5WkdVM3lmeUEKZFhZd20rRHU1RGI3Wng0NG45eUpuOGNpaEJUUGdJM3ZoNkw2bmJVUXVZQVZVYmxVRkt0M2I0N0JRV3VyRjJPSApWeW9nMW5kU1ZldmNnSHNRMzBmOEFVbWRQT3lyWmJVcVY0NHcyZytyajg1MG1DcmNucUw1SDduTmpuc3FxR3pyCkJ3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBeVhQdEZIVHd3ZUJod2hQWW41MGQKdzYwOGQrdXRHeDBRQXNLRUxQYkdkalZMS1M4TklHL3h2NW1KNEV6NFNjdUVKM09VeVF6SUdDQzRUYnB4WWJpdgpXcmJ5VGc4d0R1QnBGeHRYTDBVN2xxTGlFS1liNk41NjBHL2NhTWNMNDA3VUh3U0FsTnQ5MzZtRUxqQXdFc1ZqCklEa1d3cXJUczJSd2pJUFVUdG5ud3k5d2tyem5mUHd3alZzeTA3c3E3MjVZS2RZbG9NWVZSN21sUzJIY3NLWGoKcnA3eU5aQXJhcXBta0x4djAza0NBTWRWYitsSWo3WkZBVmgwNEJSU2Yzakd2ekdZbW1LZ2FkcTcyQ2ZXeEJESQpVUnBLWUp2YmZFSldST1VDRW9pRUppTjI0c3AvY2o3enB2SmpJV3hCckdpL3l1UEZ1UjcyV201bzFoTnNiMndBClJRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBcm85QVpoL0xZaVNLMzFKUVJQeUIKbDVGaUpuUDlYaGMrMW1URWdLYmpSbitRak8yR05HTU9sbFd5eExKaFV2b2N4QkoySzVWSjQwMGhIV1AwK1FVdgpxU2FqVm0xdTcyZmE5eDR2aDNvZEwyN3l6RUdwMmUzbXhTR1pJL3g1ZkU5UWxsNlFpQWp3NHFRdXVrODFjVkIwCkk2T21GM0ozSW4zMlVlTitNaExPcXhtWXYvUGg2TERoSHlEVGFnRmk2b3MwOWZJYmpHNHVNR05HRzN3TWJoTVAKblBqZWVLeElGNFFQQXFuQzh5WUFUbEpsZ2JFdVpWbHpEcWNOeExLaU11NTFzL2NNT2lHZnBDU1VZcXFzL05Tcgo3VFFqMnhzUWZiVWh1ODZTeFZvOHRQUzd2U09BT25OMU41TnQxQ3dzVU9SdlBuY21tOG5GeGhMMnI3RkJNcVgwCkh3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
  ],
};

export const GENESIS_FORK_VERSIONS: Record<Network, string> = {
  [Network.MAINNET]: "",
  [Network.GOERLI]: "0x00001020",
  [Network.HARDHAT]: "0x00001020",
};

export const RANDOM_PRIVATE_KEY_1 =
  "0x6da4f8d49b28f88ef7154dd4ff9d5ebd83d0c0f29d04718996f6f89a95308219";
export const RANDOM_PRIVATE_KEY_2 =
  "0x59531fe4c859a0ac36fe230b3b6485629a9e57f8671f912de04284ff02eae3cf";

export const ConstantsLib = {
  DEFAULT_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  STAKE_STAR_ROLE:
    "0x1dcad631ef6db6a23956de30880da352bcf4b330a897bf8bbdf1d5e38dcce996",
  MANAGER_ROLE:
    "0x6d439300980e333f0256d64be2c9f67e86f4493ce25f82498d6db7f4be3d9e6f",
  TREASURY_ROLE:
    "0x6efca2866b731ee4984990bacad4cde10f1ef764fb54a5206bdfd291695b1a9b",
  EPOCH_DURATION: 384,
};
