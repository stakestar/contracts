import { ChainId } from "./types";

const ADDRESSES: Record<
  ChainId,
  {
    depositContract: string;
    ssvNetwork: string;
    ssvToken: string;
    stakeStarRegistry: string;
    stakeStarETH: string;
    stakeStarRewards: string;
    stakeStar: string;
  }
> = {
  [ChainId.Goerli]: {
    depositContract: "0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC",
    ssvNetwork: "0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04",
    ssvToken: "0x3a9f01091C446bdE031E39ea8354647AFef091E7",
    stakeStarRegistry: "0x963bc8c2541Ca26Ab652D1aE5303dfa632976551",
    stakeStarRewards: "0xFF667B6f9f8c4d921763771FDC624687ACeE235F",
    stakeStarETH: "0x4f16bc88357B51733b57786bCc1928dd106D5479",
    stakeStar: "0x42D3c0b1d9d1C649c35601b033bFc4f48db0F073",
  },
};

const OPERATOR_IDS: Record<ChainId, number[]> = {
  [ChainId.Goerli]: [24, 312, 335, 50],
};

const OPERATOR_PUBLIC_KEYS: Record<ChainId, string[]> = {
  [ChainId.Goerli]: [
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBNW1idlV5Y0VqWlExQUxrLzY3TkQKRzhIWjJETTBMZTRxSXhXOFRFWjhwcFhRNDFhL29EMncrWlUzUVMzZE5EL2xQdlYzOG5sdFp2UVNQaXh1QkthZgpKK2VoemlFbjNwVWl3UWU1bWhuTnhvbUIyMXByUTNiTFYxNlBBSTEybjBIS2ZzYk4rcnVNYXpKTXBScGlqY0kxCkhjdlhwZUdXK2JZaFFVclVjWUMvU2ZiQkcvRHpkL1NlQkpvcjJvbjlJd0VaU1NFbXF5dndyQ1ltREQ2dlNrMS8KMVFEaU42L3JnejJ0UWJwMEZTckVML1lVQ2M1Qjc4UWZzbDNuNll6UlBDbTk2dWxSazdzempnSzRjOG8yVFJKUQpQa2VyREw3MTcydkNmVGNhOTRwYTlOeVU2OSsvUmZ5c3pORTRYTTJzOVQzbEpLNHVhdlNqV1NtZUFQdXk5Rjk0Ckp3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBM1J5dWpYeUxEcTl0aS9BQWdVSHYKc0VXQU90V3F5NW9BS2lmYWVkeGVUR2dWbnl2aUU2OXkyL2FLb0h0NHVPSXFDb0NyZzRsT3lKdHhsaHd4WWdBWQoyVGJMQXdqNUVLRUlMbjVoRWtVQVR2SGY0OEppbngzVzY5ME1DMk5TS2d6Qmh0NHhvdzE0V3FIenFqYzRlTTN1CnZiUFlxajkyNm1JMC9pd1F3S2p5a2RSM0g2akNIQlc1cXI3RjVjZzRVTUttUGs2dUo0RC9ZR2tpbTQ2SENaNEEKS0taL1VSZ2J6OFFMSSttaHRzV2Z5NXJxTGNFbUNGYzJCek1YNWFyamZMclFaTVZOU2tkVlZLanRmTTh2bWFrZgpIOVk5RWdIVGQyMm9qTTA2dDJBUitoMUJ1SXcyaytjM1d3dXpjVzY2QUxPMmJMbkgxV1VHSXRQZGFXK0xETjArClNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBMVc5TzFsTjl5ZXc4ZE9VV2FQSHUKb05oY3lkekh4RXNGVlhhazh6TzVxT1IxNXNOcDZFUzg1eGJrYWdaWDJCdGFIbUVIeGJaMWw1K3h6czFpMUpjcQp2MGMrVzNJdWJRaWVsM3BtYWdybUtpQ0dwOVNvY0NUR0ZWcG93UjA1eHovMUs5TUt2MnhUSmtKemJ3NEswREo2Ck8xZkxtczZuQTV5TVhNWGYvN084Mkk5MGNmc05UeEdLbjlEVGFhcC8rR01nVm1qSHliWXhCMkRaRzNmL3BGZkgKZlVvbHpsV0I0dFFxT0RDVTUyUVI0Mi96cG9XOGR2QVF4N2ZYL090SVBlSjdxd1REMkNvS1dHSHdrMjhFb2VoNAp0azB5akhNbS91dm1DOG54dTA0ZWUwSS9WU1hqdU9tL2sxSVRaMXlqaGM5SUdrd2daM2dvcDlpeWVzbmEzNVdBCjNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBbm5vUHF0M0xZcGtGVDVleS9PanUKWlh6L2JkdVRkS2NISkZDQ3ArNmJWZDJobC9HRkd0YUs3VWQ2Qm1yaUZSUzBEMjNrbitaTytkeTEzaFlzekVZMwpSZkdpRkpQZHNOUG9CQVlEdXQrM3RRVzdIYS9RZ2EyaWpRdmxYRlJnazlTZWZDMHlsL1lLNFJYRW4yZzZVbnBGCkViRUhWSFdlWkpqYnNmZUJmUUpwMTJOM0RxQzNkMjNCUVNFSytnRlZubjE5YjlEdndTbUkreXNFenlRYi95bkIKVEFGdzJiUTdoQTEyUEgweGRMbG8wZUF1N0l0ZVU2MHMyb3pCVG1lMHAvLzFHY21XcDhvbk1KMlBqcUxYVGpiZApvV1Jua3oyc2o1RzBlSWpyamNKQ3dpQWpQZE1iS0JXRU9mZ3FMZjVkSk04V1FNVEs1Uno4NWFEQUFDTFNYYnpiCklRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
  ],
};

export function addressesFor(chainId: ChainId) {
  if (ADDRESSES[chainId]) {
    return ADDRESSES[chainId];
  } else {
    throw new Error("Unsupported chainId");
  }
}

export function operatorIdsFor(chainId: ChainId) {
  if (OPERATOR_IDS[chainId]) {
    return OPERATOR_IDS[chainId];
  } else {
    throw new Error("Unsupported chainId");
  }
}

export function operatorPublicKeysFor(chainId: ChainId) {
  if (OPERATOR_PUBLIC_KEYS[chainId]) {
    return OPERATOR_PUBLIC_KEYS[chainId];
  } else {
    throw new Error("Unsupported chainId");
  }
}

export const ZERO_PRIVATE_KEY =
  "0000000000000000000000000000000000000000000000000000000000000000";
export const RANDOM_PRIVATE_KEY =
  "0x6da4f8d49b28f88ef7154dd4ff9d5ebd83d0c0f29d04718996f6f89a95308219";
