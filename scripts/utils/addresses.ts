const ADDRESSES: {
  [chainId: number]: {
    depositContract: string,
    ssvNetwork: string,
    ssvToken: string,
    stakeStarRegistry: string,
    stakeStar: string,
  }
} = {
  // goerli
  5: {
    depositContract: "0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC",
    ssvNetwork: "0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04",
    ssvToken: "0x3a9f01091C446bdE031E39ea8354647AFef091E7",
    stakeStarRegistry: "0x22Ffa9Fa82596528e568FcDa8FAFFbd7802B429d",
    stakeStar: "0xD1eaf74dcB06ce47cD61FAAb1B41cd3ccB235F7A",
  }
}

export function addressesFor(chainId: number) {
  if (Object.keys(ADDRESSES).includes(chainId.toString())) {
    return ADDRESSES[chainId];
  } else {
    throw new Error("unsupported chainId");
  }
}
