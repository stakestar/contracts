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
    ssvNetwork: "0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04",
    ssvToken: "0x3a9f01091C446bdE031E39ea8354647AFef091E7",
    stakeStarOracle: "0x14C07A9b7bC0f79fCA05A97B68a2D837e902066d",
    stakeStarOracleStrict: "0xDc90B39E2cad4a7d7FcFAf322772611CE58fa0C2",
    stakeStarTreasury: "0x04cbAf67DE002292299817fe398b9d459725d6dF",
    stakeStarRegistry: "0x8d95D336710708E499dadb5D6C798432B31E6FA7",
    withdrawalAddress: "0x72c70E14752085154DDF1ff62F5c99e83E6E2b84",
    feeRecipient: "0xF86e0f958BF6D48fDD132E1d5299f675D036BcB4",
    mevRecipient: "0x6B03611dcF090500249FEFa4a97FFaf4d3c1D1ca",
    sstarETH: "0x53DC4158307ee56FD457277c3b8f52C5f9C8aC23",
    starETH: "0x306cb8b56FC9Fcf45409C1111ad706Fa16bb1c01",
    stakeStar: "0x141756fAA3AF03e65B60A67aeb4D35d01BF18908",
    stakeStarBot: "0xFfa618ed01B71eC7dc5e11a1766bECb318567002",
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    pool: "0xa36230b9e599B9Cad2f11361c1534495D6d5d57A",
    uniswapV3Provider: "0xcde1e15a03fdF286ff5C76019f302c1D5ff8e0C5",
    uniswapHelper: "0x53730FC0d30d6D85cB696e35c89864b5e4958Fa8",
    oracle1: "",
    oracle2: "",
    oracle3: "",
  },
  [Network.HARDHAT]: {
    depositContract: "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b",
    ssvNetwork: "0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04",
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

export const OPERATOR_IDS: Record<Network, number[]> = {
  [Network.MAINNET]: [],
  [Network.GOERLI]: [24, 312, 335, 50],
  [Network.HARDHAT]: [24, 312, 335, 50],
};

export const OPERATOR_PUBLIC_KEYS: Record<Network, string[]> = {
  [Network.MAINNET]: [],
  [Network.GOERLI]: [
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBNW1idlV5Y0VqWlExQUxrLzY3TkQKRzhIWjJETTBMZTRxSXhXOFRFWjhwcFhRNDFhL29EMncrWlUzUVMzZE5EL2xQdlYzOG5sdFp2UVNQaXh1QkthZgpKK2VoemlFbjNwVWl3UWU1bWhuTnhvbUIyMXByUTNiTFYxNlBBSTEybjBIS2ZzYk4rcnVNYXpKTXBScGlqY0kxCkhjdlhwZUdXK2JZaFFVclVjWUMvU2ZiQkcvRHpkL1NlQkpvcjJvbjlJd0VaU1NFbXF5dndyQ1ltREQ2dlNrMS8KMVFEaU42L3JnejJ0UWJwMEZTckVML1lVQ2M1Qjc4UWZzbDNuNll6UlBDbTk2dWxSazdzempnSzRjOG8yVFJKUQpQa2VyREw3MTcydkNmVGNhOTRwYTlOeVU2OSsvUmZ5c3pORTRYTTJzOVQzbEpLNHVhdlNqV1NtZUFQdXk5Rjk0Ckp3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBM1J5dWpYeUxEcTl0aS9BQWdVSHYKc0VXQU90V3F5NW9BS2lmYWVkeGVUR2dWbnl2aUU2OXkyL2FLb0h0NHVPSXFDb0NyZzRsT3lKdHhsaHd4WWdBWQoyVGJMQXdqNUVLRUlMbjVoRWtVQVR2SGY0OEppbngzVzY5ME1DMk5TS2d6Qmh0NHhvdzE0V3FIenFqYzRlTTN1CnZiUFlxajkyNm1JMC9pd1F3S2p5a2RSM0g2akNIQlc1cXI3RjVjZzRVTUttUGs2dUo0RC9ZR2tpbTQ2SENaNEEKS0taL1VSZ2J6OFFMSSttaHRzV2Z5NXJxTGNFbUNGYzJCek1YNWFyamZMclFaTVZOU2tkVlZLanRmTTh2bWFrZgpIOVk5RWdIVGQyMm9qTTA2dDJBUitoMUJ1SXcyaytjM1d3dXpjVzY2QUxPMmJMbkgxV1VHSXRQZGFXK0xETjArClNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBMVc5TzFsTjl5ZXc4ZE9VV2FQSHUKb05oY3lkekh4RXNGVlhhazh6TzVxT1IxNXNOcDZFUzg1eGJrYWdaWDJCdGFIbUVIeGJaMWw1K3h6czFpMUpjcQp2MGMrVzNJdWJRaWVsM3BtYWdybUtpQ0dwOVNvY0NUR0ZWcG93UjA1eHovMUs5TUt2MnhUSmtKemJ3NEswREo2Ck8xZkxtczZuQTV5TVhNWGYvN084Mkk5MGNmc05UeEdLbjlEVGFhcC8rR01nVm1qSHliWXhCMkRaRzNmL3BGZkgKZlVvbHpsV0I0dFFxT0RDVTUyUVI0Mi96cG9XOGR2QVF4N2ZYL090SVBlSjdxd1REMkNvS1dHSHdrMjhFb2VoNAp0azB5akhNbS91dm1DOG54dTA0ZWUwSS9WU1hqdU9tL2sxSVRaMXlqaGM5SUdrd2daM2dvcDlpeWVzbmEzNVdBCjNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBbm5vUHF0M0xZcGtGVDVleS9PanUKWlh6L2JkdVRkS2NISkZDQ3ArNmJWZDJobC9HRkd0YUs3VWQ2Qm1yaUZSUzBEMjNrbitaTytkeTEzaFlzekVZMwpSZkdpRkpQZHNOUG9CQVlEdXQrM3RRVzdIYS9RZ2EyaWpRdmxYRlJnazlTZWZDMHlsL1lLNFJYRW4yZzZVbnBGCkViRUhWSFdlWkpqYnNmZUJmUUpwMTJOM0RxQzNkMjNCUVNFSytnRlZubjE5YjlEdndTbUkreXNFenlRYi95bkIKVEFGdzJiUTdoQTEyUEgweGRMbG8wZUF1N0l0ZVU2MHMyb3pCVG1lMHAvLzFHY21XcDhvbk1KMlBqcUxYVGpiZApvV1Jua3oyc2o1RzBlSWpyamNKQ3dpQWpQZE1iS0JXRU9mZ3FMZjVkSk04V1FNVEs1Uno4NWFEQUFDTFNYYnpiCklRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
  ],
  [Network.HARDHAT]: [
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBNW1idlV5Y0VqWlExQUxrLzY3TkQKRzhIWjJETTBMZTRxSXhXOFRFWjhwcFhRNDFhL29EMncrWlUzUVMzZE5EL2xQdlYzOG5sdFp2UVNQaXh1QkthZgpKK2VoemlFbjNwVWl3UWU1bWhuTnhvbUIyMXByUTNiTFYxNlBBSTEybjBIS2ZzYk4rcnVNYXpKTXBScGlqY0kxCkhjdlhwZUdXK2JZaFFVclVjWUMvU2ZiQkcvRHpkL1NlQkpvcjJvbjlJd0VaU1NFbXF5dndyQ1ltREQ2dlNrMS8KMVFEaU42L3JnejJ0UWJwMEZTckVML1lVQ2M1Qjc4UWZzbDNuNll6UlBDbTk2dWxSazdzempnSzRjOG8yVFJKUQpQa2VyREw3MTcydkNmVGNhOTRwYTlOeVU2OSsvUmZ5c3pORTRYTTJzOVQzbEpLNHVhdlNqV1NtZUFQdXk5Rjk0Ckp3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBM1J5dWpYeUxEcTl0aS9BQWdVSHYKc0VXQU90V3F5NW9BS2lmYWVkeGVUR2dWbnl2aUU2OXkyL2FLb0h0NHVPSXFDb0NyZzRsT3lKdHhsaHd4WWdBWQoyVGJMQXdqNUVLRUlMbjVoRWtVQVR2SGY0OEppbngzVzY5ME1DMk5TS2d6Qmh0NHhvdzE0V3FIenFqYzRlTTN1CnZiUFlxajkyNm1JMC9pd1F3S2p5a2RSM0g2akNIQlc1cXI3RjVjZzRVTUttUGs2dUo0RC9ZR2tpbTQ2SENaNEEKS0taL1VSZ2J6OFFMSSttaHRzV2Z5NXJxTGNFbUNGYzJCek1YNWFyamZMclFaTVZOU2tkVlZLanRmTTh2bWFrZgpIOVk5RWdIVGQyMm9qTTA2dDJBUitoMUJ1SXcyaytjM1d3dXpjVzY2QUxPMmJMbkgxV1VHSXRQZGFXK0xETjArClNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBMVc5TzFsTjl5ZXc4ZE9VV2FQSHUKb05oY3lkekh4RXNGVlhhazh6TzVxT1IxNXNOcDZFUzg1eGJrYWdaWDJCdGFIbUVIeGJaMWw1K3h6czFpMUpjcQp2MGMrVzNJdWJRaWVsM3BtYWdybUtpQ0dwOVNvY0NUR0ZWcG93UjA1eHovMUs5TUt2MnhUSmtKemJ3NEswREo2Ck8xZkxtczZuQTV5TVhNWGYvN084Mkk5MGNmc05UeEdLbjlEVGFhcC8rR01nVm1qSHliWXhCMkRaRzNmL3BGZkgKZlVvbHpsV0I0dFFxT0RDVTUyUVI0Mi96cG9XOGR2QVF4N2ZYL090SVBlSjdxd1REMkNvS1dHSHdrMjhFb2VoNAp0azB5akhNbS91dm1DOG54dTA0ZWUwSS9WU1hqdU9tL2sxSVRaMXlqaGM5SUdrd2daM2dvcDlpeWVzbmEzNVdBCjNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
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
