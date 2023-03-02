# StakeStar Contracts

## Development agreements

- all changes should be made in a separate branch and submitted through a pull request to `main`
- all version updates should be made in a unified manner using `yarn bump`
- all releases should have release notes

## To do

- add basic tests
    - access control **DONE**
    - setters **DONE**
- replace rateBottomLimit/rateTopLimit with relative check instead
    - add "force" method to submit without the check
- add very detailed tests
    - rate **DONE**
    - rate deviation **DONE**
    - availability methods
    - TreasurySwap
    - CommitSnapshot validations
    - OracleNetwork
- add commission logic
- replace StakeStarETH with 2 receipt tokens
    - this should be made in a separate branch
- introduce OracleNetwork with N out of M consensus

