# StakeStar Contracts

## Development agreements

- all changes should be made in a separate branch and submitted through a pull request to `main`
- all version updates should be made in a unified manner using `yarn bump`
- all releases should have release notes

## To do

- add basic tests
  - access control **DONE**
  - setters **DONE**
- add very detailed tests
  - rate **DONE**
  - availability methods
  - oracle network
  - TreasurySwap
  - CommitSnapshot validations
- add commission logic
- replace StakeStarETH with 2 receipt tokens
  - this should be made in a separate branch
- introduce OracleNetwork with N out of M consensus
- can rate between SubmitSnapshot be out of range?
