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
    oracleNetwork: string;
    stakeStarProvider: string;
    stakeStarTreasury: string;
    stakeStarRegistry: string;
    stakeStarETH: string;
    withdrawalAddress: string;
    feeRecipient: string;
    stakeStar: string;
    stakeStarBot: string;
    weth: string;
    swapRouter: string;
    quoter: string;
    pool: string;
    swapProvider: string;
    uniswapV3Provider: string;
    twap: string;
  }
> = {
  [Network.MAINNET]: {
    depositContract: "",
    ssvNetwork: "",
    ssvToken: "",
    oracleNetwork: "",
    stakeStarProvider: "",
    stakeStarTreasury: "",
    stakeStarRegistry: "",
    withdrawalAddress: "",
    feeRecipient: "",
    stakeStarETH: "",
    stakeStar: "",
    stakeStarBot: "",
    weth: "",
    swapRouter: "",
    quoter: "",
    pool: "",
    swapProvider: "",
    uniswapV3Provider: "",
    twap: "",
  },
  [Network.GOERLI]: {
    depositContract: "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b",
    ssvNetwork: "0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04",
    ssvToken: "0x3a9f01091C446bdE031E39ea8354647AFef091E7",
    oracleNetwork: "",
    stakeStarProvider: "0xD71b3059D7A233B130Cc5942c868Fe042822507F",
    stakeStarTreasury: "0x52CEd95E80619F7FA269fDf6ea42aCb8212BDD24",
    stakeStarRegistry: "0x9c1cF3C3a9C99065C1A53f6c9e6aB8fFe88bB1e5",
    withdrawalAddress: "",
    feeRecipient: "",
    stakeStarETH: "0x2BAd1B83595a8F5452C707f127ADD1C28D17D686",
    stakeStar: "0x30ee6090e416234430841e37Ffbc4E855fC133F0",
    stakeStarBot: "0xFfa618ed01B71eC7dc5e11a1766bECb318567002",
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    pool: "0xa36230b9e599B9Cad2f11361c1534495D6d5d57A",
    swapProvider: "0xEd7c2BF9092fE13905281d9f8A7Fbe72d9c9d55F",
    uniswapV3Provider: "0xEd7c2BF9092fE13905281d9f8A7Fbe72d9c9d55F",
    twap: "0x3CF623f6ece2E389263e479Dee23Fd94E3D9351a",
  },
  [Network.HARDHAT]: {
    depositContract: "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b",
    ssvNetwork: "0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04",
    ssvToken: "0x3a9f01091C446bdE031E39ea8354647AFef091E7",
    oracleNetwork: "",
    stakeStarProvider: "",
    stakeStarTreasury: "",
    stakeStarRegistry: "",
    withdrawalAddress: "",
    feeRecipient: "",
    stakeStarETH: "",
    stakeStar: "",
    stakeStarBot: "",
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    pool: "0xa36230b9e599B9Cad2f11361c1534495D6d5d57A",
    swapProvider: "",
    uniswapV3Provider: "",
    twap: "",
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
