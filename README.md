# StakeStar Contracts

## Development agreements

- all changes should be made in a separate branch and submitted through a pull request to `main`
- all version updates should be made in a unified manner using `yarn bump`
- all releases should have release notes

## To do

- ~~define what we send to Treasury: ssETH or ETH~~
  - we send ssETH when take commission
  - then on user stake we swap back to ETH
- ~~all required setters/getters~~
- ~~withdrawalAddress/feeRecipient/mevCoinbase addresses are taken into account~~
- ~~validator creation/destroy availability~~
- rate are calculated correctly
- ~~how to take into account feeRecipient and mevCoinbase~~
- add library with common constants
- ~~refill local pool on harvest?~~
  - no, only on user stakes
- ~~refactor Treasury~~
