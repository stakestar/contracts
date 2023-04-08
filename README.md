# StakeStar Contracts

## Development agreements

- all changes should be made in a separate branch and submitted through a pull request to `main`
- all version updates should be made in a unified manner using `yarn bump`
- all releases should have release notes

## Deploy & Setup

```shell
yarn hardhat deployAll --network goerli
yarn hardhat setLocalPoolParameters --local-pool-max-size 4000000000000000000 --local-pool-unstake-limit 1000000000000000000 --local-pool-unstake-frequency-limit 100 --network goerli
yarn hardhat allowListOperators --network goerli
yarn hardhat setTreasuryCommission --value 5000 --network goerli
yarn hardhat setTreasuryRunway --min-runway 432000 --max-runway 1296000 --network goerli
yarn hardhat setSwapParameters --fee 3000 --slippage 98000 --twap-interval 3600 --min-liquidity 100000000000000000 --network goerli
yarn hardhat grant-ManagerRole --network goerli
yarn hardhat grant-OracleRole --network goerli
```
