# StakeStar Contracts

## Development agreements

- all changes should be made in a separate branch and submitted through a pull request to `main`
- all version updates should be made in a unified manner using `yarn bump`
- all releases should have release notes

## To do

- add basic tests **DONE**
    - access control **DONE**
    - setters **DONE**
- replace rateBottomLimit/rateTopLimit with relative check instead **DONE**
    - add "force" method to submit without the check **DONE**
- add very detailed tests
    - rate **DONE**
    - rate deviation **DONE**
    - availability methods **DONE**
    - TreasuryPayback
    - CommitSnapshot validations
- add commission logic
- replace StakeStarETH with 2 receipt tokens
    - should be made in a separate branch
- introduce OracleNetwork with N out of M consensus
    - with corresponding tests
    - should be made in a separate branch
