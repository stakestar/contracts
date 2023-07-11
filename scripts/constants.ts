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
    depositContract: "",
    ssvNetwork: "",
    ssvNetworkOwner: "",
    ssvNetworkViews: "",
    ssvToken: "",
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
    weth: "",
    swapRouter: "",
    quoter: "",
    pool: "",
    uniswapV3Provider: "",
    uniswapHelper: "",
    oracle1: "",
    oracle2: "",
    oracle3: "",
  },
  [Network.GOERLI]: {
    depositContract: "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b",
    ssvNetwork: "0xC3CD9A0aE89Fff83b71b58b6512D43F8a41f363D",
    ssvNetworkOwner: "0xC564AF154621Ee8D0589758d535511aEc8f67b40",
    ssvNetworkViews: "0x807E241D3118fC8F231948C60aa42a4C606C2545",
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
    ssvNetworkViews: "0x807E241D3118fC8F231948C60aa42a4C606C2545",
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
  [Network.MAINNET]: [],
  [Network.GOERLI]: [
    BigNumber.from(56),
    BigNumber.from(65),
    BigNumber.from(66),
    BigNumber.from(68),
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
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBNW1idlV5Y0VqWlExQUxrLzY3TkQKRzhIWjJETTBMZTRxSXhXOFRFWjhwcFhRNDFhL29EMncrWlUzUVMzZE5EL2xQdlYzOG5sdFp2UVNQaXh1QkthZgpKK2VoemlFbjNwVWl3UWU1bWhuTnhvbUIyMXByUTNiTFYxNlBBSTEybjBIS2ZzYk4rcnVNYXpKTXBScGlqY0kxCkhjdlhwZUdXK2JZaFFVclVjWUMvU2ZiQkcvRHpkL1NlQkpvcjJvbjlJd0VaU1NFbXF5dndyQ1ltREQ2dlNrMS8KMVFEaU42L3JnejJ0UWJwMEZTckVML1lVQ2M1Qjc4UWZzbDNuNll6UlBDbTk2dWxSazdzempnSzRjOG8yVFJKUQpQa2VyREw3MTcydkNmVGNhOTRwYTlOeVU2OSsvUmZ5c3pORTRYTTJzOVQzbEpLNHVhdlNqV1NtZUFQdXk5Rjk0Ckp3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBMVc5TzFsTjl5ZXc4ZE9VV2FQSHUKb05oY3lkekh4RXNGVlhhazh6TzVxT1IxNXNOcDZFUzg1eGJrYWdaWDJCdGFIbUVIeGJaMWw1K3h6czFpMUpjcQp2MGMrVzNJdWJRaWVsM3BtYWdybUtpQ0dwOVNvY0NUR0ZWcG93UjA1eHovMUs5TUt2MnhUSmtKemJ3NEswREo2Ck8xZkxtczZuQTV5TVhNWGYvN084Mkk5MGNmc05UeEdLbjlEVGFhcC8rR01nVm1qSHliWXhCMkRaRzNmL3BGZkgKZlVvbHpsV0I0dFFxT0RDVTUyUVI0Mi96cG9XOGR2QVF4N2ZYL090SVBlSjdxd1REMkNvS1dHSHdrMjhFb2VoNAp0azB5akhNbS91dm1DOG54dTA0ZWUwSS9WU1hqdU9tL2sxSVRaMXlqaGM5SUdrd2daM2dvcDlpeWVzbmEzNVdBCjNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBM1J5dWpYeUxEcTl0aS9BQWdVSHYKc0VXQU90V3F5NW9BS2lmYWVkeGVUR2dWbnl2aUU2OXkyL2FLb0h0NHVPSXFDb0NyZzRsT3lKdHhsaHd4WWdBWQoyVGJMQXdqNUVLRUlMbjVoRWtVQVR2SGY0OEppbngzVzY5ME1DMk5TS2d6Qmh0NHhvdzE0V3FIenFqYzRlTTN1CnZiUFlxajkyNm1JMC9pd1F3S2p5a2RSM0g2akNIQlc1cXI3RjVjZzRVTUttUGs2dUo0RC9ZR2tpbTQ2SENaNEEKS0taL1VSZ2J6OFFMSSttaHRzV2Z5NXJxTGNFbUNGYzJCek1YNWFyamZMclFaTVZOU2tkVlZLanRmTTh2bWFrZgpIOVk5RWdIVGQyMm9qTTA2dDJBUitoMUJ1SXcyaytjM1d3dXpjVzY2QUxPMmJMbkgxV1VHSXRQZGFXK0xETjArClNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBbm5vUHF0M0xZcGtGVDVleS9PanUKWlh6L2JkdVRkS2NISkZDQ3ArNmJWZDJobC9HRkd0YUs3VWQ2Qm1yaUZSUzBEMjNrbitaTytkeTEzaFlzekVZMwpSZkdpRkpQZHNOUG9CQVlEdXQrM3RRVzdIYS9RZ2EyaWpRdmxYRlJnazlTZWZDMHlsL1lLNFJYRW4yZzZVbnBGCkViRUhWSFdlWkpqYnNmZUJmUUpwMTJOM0RxQzNkMjNCUVNFSytnRlZubjE5YjlEdndTbUkreXNFenlRYi95bkIKVEFGdzJiUTdoQTEyUEgweGRMbG8wZUF1N0l0ZVU2MHMyb3pCVG1lMHAvLzFHY21XcDhvbk1KMlBqcUxYVGpiZApvV1Jua3oyc2o1RzBlSWpyamNKQ3dpQWpQZE1iS0JXRU9mZ3FMZjVkSk04V1FNVEs1Uno4NWFEQUFDTFNYYnpiCklRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
  ],
  [Network.HARDHAT]: [
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBNW1idlV5Y0VqWlExQUxrLzY3TkQKRzhIWjJETTBMZTRxSXhXOFRFWjhwcFhRNDFhL29EMncrWlUzUVMzZE5EL2xQdlYzOG5sdFp2UVNQaXh1QkthZgpKK2VoemlFbjNwVWl3UWU1bWhuTnhvbUIyMXByUTNiTFYxNlBBSTEybjBIS2ZzYk4rcnVNYXpKTXBScGlqY0kxCkhjdlhwZUdXK2JZaFFVclVjWUMvU2ZiQkcvRHpkL1NlQkpvcjJvbjlJd0VaU1NFbXF5dndyQ1ltREQ2dlNrMS8KMVFEaU42L3JnejJ0UWJwMEZTckVML1lVQ2M1Qjc4UWZzbDNuNll6UlBDbTk2dWxSazdzempnSzRjOG8yVFJKUQpQa2VyREw3MTcydkNmVGNhOTRwYTlOeVU2OSsvUmZ5c3pORTRYTTJzOVQzbEpLNHVhdlNqV1NtZUFQdXk5Rjk0Ckp3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBMVc5TzFsTjl5ZXc4ZE9VV2FQSHUKb05oY3lkekh4RXNGVlhhazh6TzVxT1IxNXNOcDZFUzg1eGJrYWdaWDJCdGFIbUVIeGJaMWw1K3h6czFpMUpjcQp2MGMrVzNJdWJRaWVsM3BtYWdybUtpQ0dwOVNvY0NUR0ZWcG93UjA1eHovMUs5TUt2MnhUSmtKemJ3NEswREo2Ck8xZkxtczZuQTV5TVhNWGYvN084Mkk5MGNmc05UeEdLbjlEVGFhcC8rR01nVm1qSHliWXhCMkRaRzNmL3BGZkgKZlVvbHpsV0I0dFFxT0RDVTUyUVI0Mi96cG9XOGR2QVF4N2ZYL090SVBlSjdxd1REMkNvS1dHSHdrMjhFb2VoNAp0azB5akhNbS91dm1DOG54dTA0ZWUwSS9WU1hqdU9tL2sxSVRaMXlqaGM5SUdrd2daM2dvcDlpeWVzbmEzNVdBCjNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBM1J5dWpYeUxEcTl0aS9BQWdVSHYKc0VXQU90V3F5NW9BS2lmYWVkeGVUR2dWbnl2aUU2OXkyL2FLb0h0NHVPSXFDb0NyZzRsT3lKdHhsaHd4WWdBWQoyVGJMQXdqNUVLRUlMbjVoRWtVQVR2SGY0OEppbngzVzY5ME1DMk5TS2d6Qmh0NHhvdzE0V3FIenFqYzRlTTN1CnZiUFlxajkyNm1JMC9pd1F3S2p5a2RSM0g2akNIQlc1cXI3RjVjZzRVTUttUGs2dUo0RC9ZR2tpbTQ2SENaNEEKS0taL1VSZ2J6OFFMSSttaHRzV2Z5NXJxTGNFbUNGYzJCek1YNWFyamZMclFaTVZOU2tkVlZLanRmTTh2bWFrZgpIOVk5RWdIVGQyMm9qTTA2dDJBUitoMUJ1SXcyaytjM1d3dXpjVzY2QUxPMmJMbkgxV1VHSXRQZGFXK0xETjArClNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBbm5vUHF0M0xZcGtGVDVleS9PanUKWlh6L2JkdVRkS2NISkZDQ3ArNmJWZDJobC9HRkd0YUs3VWQ2Qm1yaUZSUzBEMjNrbitaTytkeTEzaFlzekVZMwpSZkdpRkpQZHNOUG9CQVlEdXQrM3RRVzdIYS9RZ2EyaWpRdmxYRlJnazlTZWZDMHlsL1lLNFJYRW4yZzZVbnBGCkViRUhWSFdlWkpqYnNmZUJmUUpwMTJOM0RxQzNkMjNCUVNFSytnRlZubjE5YjlEdndTbUkreXNFenlRYi95bkIKVEFGdzJiUTdoQTEyUEgweGRMbG8wZUF1N0l0ZVU2MHMyb3pCVG1lMHAvLzFHY21XcDhvbk1KMlBqcUxYVGpiZApvV1Jua3oyc2o1RzBlSWpyamNKQ3dpQWpQZE1iS0JXRU9mZ3FMZjVkSk04V1FNVEs1Uno4NWFEQUFDTFNYYnpiCklRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
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
