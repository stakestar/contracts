# StakeStar Contracts

## Development agreements

- all changes should be made in a separate branch and submitted through a pull request to `main`
- all version updates should be made in a unified manner using `yarn bump`
- all releases should have release notes

## Deploy & Setup

1. deploy all contracts, grant Admin/StakeStar/Treasury roles, set addresses

```shell
yarn hardhat deployAll --network goerli
```

2. set StakeStar local pool parameters

```shell
yarn hardhat setLocalPoolParameters --local-pool-max-size 4000000000000000000 --local-pool-unstake-limit 1000000000000000000 --local-pool-unstake-frequency-limit 100 --network goerli
```

3. add operators to StakeStarRegistry allow list

```shell
yarn hardhat allowListOperators --network goerli
```

4. set StakeStarTreasury commission

```shell
yarn hardhat setTreasuryCommission --value 5000 --network goerli
```

5. set StakeStarTreasury runway

```shell
yarn hardhat setTreasuryRunway --min-runway 432000 --max-runway 1296000 --network goerli
```

6. set UniswapV3Provider swap parameters

```shell
yarn hardhat setSwapParameters --fee 3000 --slippage 98000 --twap-interval 3600 --min-liquidity 100000000000000000 --network goerli
```

7. grant Manager roles

```shell
yarn hardhat grant-ManagerRole --network goerli
```

8. grant Oracle roles

```shell
yarn hardhat grant-OracleRole --network goerli
```

## To do

- add tests for 2 tokens
