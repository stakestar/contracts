import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ZERO } from "../scripts/constants";
import { deployStakeStarFixture } from "./fixture";
import { BigNumber } from "ethers";

describe("StakeStar", function () {
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { stakeStarPublic, owner } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarPublic.hasRole(
          await stakeStarPublic.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
    });

    it("Should set the right manager", async function () {
      const { stakeStarPublic, manager } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarPublic.hasRole(
          await stakeStarPublic.MANAGER_ROLE(),
          manager.address
        )
      ).to.equal(true);
    });

    it("Should set the right owner for ssETH", async function () {
      const { stakeStarPublic, stakeStarETH } = await loadFixture(
        deployStakeStarFixture
      );
      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.STAKE_STAR_ROLE(),
          stakeStarPublic.address
        )
      ).to.equal(true);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow to call methods without corresponding roles", async function () {
      const { stakeStarPublic, validatorParams, otherAccount, addresses } =
        await loadFixture(deployStakeStarFixture);

      const defaultAdminRole = await stakeStarPublic.DEFAULT_ADMIN_ROLE();
      const managerRole = await stakeStarPublic.MANAGER_ROLE();

      await expect(stakeStarPublic.setLocalPoolSize(1)).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.createValidator(validatorParams, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${managerRole}`
      );
      await expect(
        stakeStarPublic.updateValidator(validatorParams, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.destroyValidator(validatorParams.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${managerRole}`
      );
      await expect(
        stakeStarPublic.manageSSV(addresses.weth, 3000, 0, 0)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });
  });

  describe("Stake", function () {
    it("Should send ETH to the contract", async function () {
      const { stakeStarPublic, stakeStarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarPublic.stake()).to.be.revertedWith(
        "no eth transferred"
      );

      const stakeAmountETH = BigNumber.from(1);
      const stakeAmountSS = await stakeStarPublic.ETH_to_ssETH_approximate(
        stakeAmountETH
      );

      await expect(
        stakeStarPublic.stake({ value: stakeAmountETH })
      ).to.changeEtherBalances(
        [otherAccount, stakeStarPublic],
        [stakeAmountETH.mul(-1), stakeAmountETH]
      );

      await expect(
        stakeStarPublic.stake({ value: stakeAmountETH })
      ).to.changeTokenBalance(stakeStarETH, otherAccount, stakeAmountSS);

      await expect(stakeStarPublic.stake({ value: stakeAmountETH }))
        .to.emit(stakeStarPublic, "Stake")
        .withArgs(otherAccount.address, stakeAmountETH, stakeAmountSS);
    });
  });

  describe("Unstake", function () {
    it("Should create pendingUnstake", async function () {
      const { stakeStarPublic, otherAccount, stakeStarETH } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeAmountEth = ethers.utils.parseEther("2");
      await stakeStarPublic.stake({ value: stakeAmountEth });
      const ssEthAmount = await stakeStarETH.balanceOf(otherAccount.address);

      expect(await stakeStarETH.totalSupply()).to.equal(ssEthAmount);

      const unstakeAmountSS = ssEthAmount.div(2);
      const unstakeAmountEth = await stakeStarPublic.ssETH_to_ETH_approximate(
        unstakeAmountSS
      );
      const shouldBeBurntSS = unstakeAmountSS;

      await expect(
        stakeStarPublic.unstake(unstakeAmountSS)
      ).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        shouldBeBurntSS.mul(-1)
      );

      expect(await stakeStarETH.totalSupply()).to.equal(
        ssEthAmount.sub(shouldBeBurntSS)
      );
      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(
        unstakeAmountEth
      );
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(unstakeAmountEth);

      await stakeStarPublic.claim();

      await expect(stakeStarPublic.unstake(unstakeAmountSS))
        .to.emit(stakeStarPublic, "Unstake")
        .withArgs(otherAccount.address, unstakeAmountSS, unstakeAmountEth);
    });
  });

  describe("Claim", function () {
    it("Should finish pendingUnstake and send Ether", async function () {
      const {
        stakeStarManager,
        stakeStarPublic,
        stakeStarRegistry,
        ssvToken,
        validatorParams,
        owner,
        otherAccount,
      } = await loadFixture(deployStakeStarFixture);

      for (const operatorId of validatorParams.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      const stakeAmount = ethers.utils.parseEther("32");
      const unstakeAmount = stakeAmount.div(2);

      await expect(stakeStarPublic.claim()).to.be.revertedWith(
        "no pending unstake"
      );

      await stakeStarPublic.stake({ value: stakeAmount });

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      await stakeStarManager.createValidator(
        validatorParams,
        await ssvToken.balanceOf(stakeStarManager.address)
      );

      await stakeStarPublic.unstake(unstakeAmount);

      await expect(stakeStarPublic.claim()).to.be.revertedWith(
        "failed to send Ether"
      );

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: stakeAmount,
      });

      await expect(stakeStarPublic.claim()).to.changeEtherBalances(
        [stakeStarPublic.address, otherAccount.address],
        [unstakeAmount.mul(-1), unstakeAmount]
      );

      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(ZERO);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(ZERO);

      await stakeStarPublic.unstake(unstakeAmount);
      await expect(stakeStarPublic.claim())
        .to.emit(stakeStarPublic, "Claim")
        .withArgs(otherAccount.address, unstakeAmount);
    });
  });

  describe("UnstakeAndClaim", function () {
    it("Should unstake and claim in a single tx", async function () {
      const { stakeStarPublic, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeAmount = ethers.utils.parseEther("2");
      const unstakeAndClaimAmount = stakeAmount.div(2);

      await stakeStarPublic.stake({ value: stakeAmount });

      await expect(
        stakeStarPublic.unstakeAndClaim(unstakeAndClaimAmount)
      ).to.changeEtherBalances(
        [stakeStarPublic.address, otherAccount.address],
        [unstakeAndClaimAmount.mul(-1), unstakeAndClaimAmount]
      );

      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(ZERO);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(ZERO);
    });
  });

  describe("CreateValidator", function () {
    it("Should create a validator", async function () {
      const {
        stakeStarManager,
        ssvToken,
        stakeStarRegistry,
        validatorParams,
        owner,
        manager,
      } = await loadFixture(deployStakeStarFixture);

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      const ssvBalance = await ssvToken.balanceOf(stakeStarManager.address);

      await expect(
        stakeStarManager.createValidator(validatorParams, ssvBalance)
      ).to.be.revertedWith("cannot create validator");

      await manager.sendTransaction({
        to: stakeStarManager.address,
        value: ethers.utils.parseEther("99"),
      });

      await expect(
        stakeStarManager.createValidator(validatorParams, ssvBalance)
      ).to.be.revertedWith("operators not allowListed");

      for (const operatorId of validatorParams.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      await expect(
        stakeStarManager.createValidator(validatorParams, ssvBalance)
      ).to.emit(stakeStarManager, "CreateValidator");
    });

    it("Should take into account balance, localPoolSize, pendingUnstakeSum", async function () {
      const {
        stakeStarOwner,
        stakeStarManager,
        stakeStarPublic,
        stakeStarRegistry,
        ssvToken,
        validatorParams,
        owner,
      } = await loadFixture(deployStakeStarFixture);

      for (const operatorId of validatorParams.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await owner.sendTransaction({
        to: stakeStarPublic.address,
        value: ethers.utils.parseEther("32"),
      });

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        true
      );

      await stakeStarOwner.setLocalPoolSize(1);

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await owner.sendTransaction({
        to: stakeStarPublic.address,
        value: 1,
      });

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        true
      );

      await stakeStarPublic.stake({ value: ethers.utils.parseEther("32") });

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarOwner.address,
          await ssvToken.balanceOf(owner.address)
        );
      const ssvBalance = await ssvToken.balanceOf(stakeStarOwner.address);
      await stakeStarManager.createValidator(validatorParams, ssvBalance);

      await stakeStarPublic.unstake(ethers.utils.parseEther("32"));

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await owner.sendTransaction({
        to: stakeStarPublic.address,
        value: ethers.utils.parseEther("32"),
      });

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        true
      );
    });
  });

  describe("UpdateValidator", function () {
    it("Should update existing validator", async function () {
      const {
        stakeStarOwner,
        stakeStarManager,
        stakeStarRegistry,
        ssvToken,
        validatorParams,
        owner,
        manager,
      } = await loadFixture(deployStakeStarFixture);

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarOwner.address,
          await ssvToken.balanceOf(owner.address)
        );
      const ssvBalance = await ssvToken.balanceOf(stakeStarOwner.address);

      await manager.sendTransaction({
        to: stakeStarOwner.address,
        value: ethers.utils.parseEther("99"),
      });

      await expect(
        stakeStarOwner.updateValidator(validatorParams, ssvBalance)
      ).to.be.revertedWith("validator missing");

      for (const operatorId of validatorParams.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      await expect(
        stakeStarManager.createValidator(validatorParams, ssvBalance.div(2))
      ).to.emit(stakeStarManager, "CreateValidator");

      validatorParams.operatorIds[0] = 127;

      await expect(
        stakeStarOwner.updateValidator(validatorParams, ssvBalance)
      ).to.be.revertedWith("operators not allowListed");

      await stakeStarRegistry.connect(owner).addOperatorToAllowList(127);

      await expect(
        stakeStarOwner.updateValidator(validatorParams, ssvBalance.div(2))
      ).to.emit(stakeStarOwner, "UpdateValidator");
    });
  });

  describe("DestroyValidator", function () {
    it("Should revert unless implemented", async function () {
      const { stakeStarManager, validatorParams } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        stakeStarManager.destroyValidator(validatorParams.publicKey)
      ).to.be.revertedWith("not implemented");
      await expect(
        stakeStarManager.validatorDestructionAvailability()
      ).to.be.revertedWith("not implemented");
    });
  });

  describe("harvest", function () {
    it("Should pull rewards from StakeStarRewards", async function () {
      const {
        stakeStarPublic,
        stakeStarRewards,
        stakeStarETH,
        stakeStarTreasury,
        otherAccount,
      } = await loadFixture(deployStakeStarFixture);

      await stakeStarTreasury.setCommission(5000); // 5%

      await expect(stakeStarPublic.harvest()).to.be.revertedWith(
        "no rewards available"
      );

      const rateBefore = await stakeStarETH.rate();

      await stakeStarPublic.stake({ value: 1 });

      await otherAccount.sendTransaction({
        to: stakeStarRewards.address,
        value: 100,
      });
      await expect(stakeStarPublic.harvest()).to.changeEtherBalances(
        [stakeStarPublic, stakeStarRewards],
        [95, -100]
      );

      const rateAfter = await stakeStarETH.rate();
      expect(rateAfter.gt(rateBefore)).to.equal(true);

      await otherAccount.sendTransaction({
        to: stakeStarRewards.address,
        value: 100,
      });
      await expect(stakeStarPublic.harvest())
        .to.emit(stakeStarPublic, "Harvest")
        .withArgs(95);

      await otherAccount.sendTransaction({
        to: stakeStarRewards.address,
        value: 100,
      });
      await expect(stakeStarPublic.harvest()).to.changeEtherBalance(
        stakeStarTreasury,
        5
      );
    });
  });

  describe("manageSSV", function () {
    it("Should buy SSV token on UNI V3", async function () {
      const { stakeStarOwner, addresses, ssvToken, ssvNetwork } =
        await loadFixture(deployStakeStarFixture);

      expect(await ssvNetwork.getAddressBalance(stakeStarOwner.address)).to.eq(
        0
      );

      const amountIn = BigNumber.from("100000000000000000"); // 0.1 eth
      const expectedAmountOut = BigNumber.from("14000000000000000000"); // 14 SSV
      const precision = BigNumber.from(1e7);

      await stakeStarOwner.stake({ value: amountIn });
      await expect(
        stakeStarOwner.manageSSV(
          addresses.weth,
          3000,
          amountIn,
          expectedAmountOut
        )
      ).to.emit(stakeStarOwner, "ManageSSV");

      expect(
        await ssvNetwork.getAddressBalance(stakeStarOwner.address)
      ).to.be.gte(expectedAmountOut);
      expect(await ssvToken.balanceOf(stakeStarOwner.address)).to.lt(precision);
    });
  });

  describe("Linear approximation", function () {
    it("Should approximate ssETH rate", async function () {
      const {
        hre,
        stakeStarOwner,
        stakeStarPublic,
        otherAccount,
        stakeStarETH,
        stakeStarProviderManager,
      } = await loadFixture(deployStakeStarFixture);

      const one = ethers.utils.parseEther("1");
      const oneHundred = ethers.utils.parseEther("100");

      // some stake required because of division by zero
      await stakeStarPublic.stake({ value: oneHundred });
      // one to one
      const balance1 = await stakeStarETH.balanceOf(otherAccount.address);
      expect(balance1).to.equal(oneHundred);

      const getTime = async function () {
        return (
          await hre.ethers.provider.getBlock(
            await hre.ethers.provider.getBlockNumber()
          )
        ).timestamp;
      };
      const initialTimestamp = await getTime();

      // not initialized yet
      await expect(
        stakeStarPublic.approximateStakingSurplus(initialTimestamp)
      ).to.be.revertedWith("point A or B not initialized");
      expect(await stakeStarPublic.currentApproximateRate()).to.equal(one);

      // distribute 0.01 first time
      await stakeStarProviderManager.commitStakingSurplus(
        ethers.utils.parseEther("0.01"),
        initialTimestamp - 300
      );
      await expect(stakeStarOwner.commitStakingSurplus())
        .to.emit(stakeStarOwner, "CommitStakingSurplus")
        .withArgs(ethers.utils.parseEther("0.01"), initialTimestamp - 300);
      // still not initialized yet (only one point)
      await expect(
        stakeStarPublic.approximateStakingSurplus(initialTimestamp)
      ).to.be.revertedWith("point A or B not initialized");
      expect(await stakeStarPublic.currentApproximateRate()).to.equal(one);

      // distribute another 0.01
      await stakeStarProviderManager.commitStakingSurplus(
        ethers.utils.parseEther("0.02"),
        initialTimestamp - 50
      );
      await stakeStarOwner.commitStakingSurplus();

      // two points initialized. If timestamp = last point, reward = last reward
      expect(
        await stakeStarPublic.approximateStakingSurplus(initialTimestamp - 50)
      ).to.equal(ethers.utils.parseEther("0.02"));

      // 0.02 will be distributed by 100 staked ethers
      expect(await stakeStarETH.rate()).to.equal(
        ethers.utils
          .parseEther("100.02")
          .mul(one)
          .div(ethers.utils.parseEther("100"))
      );

      // 50 seconds spent with rate 0.01 ether / 250 seconds
      expect(
        await stakeStarPublic.approximateStakingSurplus(initialTimestamp)
      ).to.equal(ethers.utils.parseEther("0.022"));

      const getCurrentRate = async function (
        totalStakedEth: BigNumber,
        tm: number | undefined = undefined,
        totalStakedSS: BigNumber | undefined = undefined
      ) {
        totalStakedSS = totalStakedSS
          ? totalStakedSS
          : await stakeStarETH.totalSupply();
        tm = tm ? tm : await getTime();

        // current reward = 0.01 / 250 * timedelta + 0.02
        const currentReward = ethers.utils
          .parseEther("0.01")
          .div(250)
          .mul(tm - initialTimestamp + 50)
          .add(ethers.utils.parseEther("0.02"));
        expect(await stakeStarPublic.approximateStakingSurplus(tm)).to.equal(
          currentReward
        );

        // so rate (totalStakedEth + currentReward) / total staked
        const currentRate = totalStakedEth
          .add(currentReward)
          .mul(one)
          .div(totalStakedSS);

        return [currentRate, currentReward];
      };

      await hre.network.provider.request({ method: "evm_mine", params: [] });
      let [currentRate] = await getCurrentRate(ethers.utils.parseEther("100"));
      expect(await stakeStarPublic.currentApproximateRate()).to.equal(
        currentRate
      );

      await hre.network.provider.request({ method: "evm_mine", params: [] });
      [currentRate] = await getCurrentRate(ethers.utils.parseEther("100"));
      expect(await stakeStarPublic.currentApproximateRate()).to.equal(
        currentRate
      );

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        initialTimestamp + 100,
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });
      await getCurrentRate(ethers.utils.parseEther("100"));

      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
        balance1
      );

      // Another Stake 100
      const constRateBeforeStake = await stakeStarETH.rate();
      const tx = await stakeStarPublic.stake({
        value: ethers.utils.parseEther("100"),
      });
      // staking shouldn't change constant rate
      expect(await stakeStarETH.rate()).to.be.equal(constRateBeforeStake);
      const tx_timestamp = (await hre.ethers.provider.getBlock(tx.blockNumber))
        .timestamp;
      const tx_rate = await stakeStarPublic.approximateRate(tx_timestamp);

      let [currentRateB] = await getCurrentRate(
        ethers.utils.parseEther("100"),
        tx_timestamp,
        balance1
      );

      let newStaked = ethers.utils.parseEther("100").mul(one).div(currentRateB);
      const balance2 = await stakeStarETH.balanceOf(otherAccount.address);
      expect(balance2).to.equal(newStaked.add(balance1));

      const totalStakedEth = balance2.mul(constRateBeforeStake).div(one);
      expect(totalStakedEth).to.be.equal(await stakeStarETH.totalSupplyEth());
      let [currentRateC] = await getCurrentRate(
        totalStakedEth.sub(ethers.utils.parseEther("0.02")),
        tx_timestamp,
        balance2
      );
      expect(currentRateC).to.be.equal(tx_rate);

      await stakeStarPublic.unstake(newStaked);
      await stakeStarPublic.claim();
    });
  });

  describe("reservedTreasuryCommission", function () {
    it("Should take commission on staking surplus", async function () {
      const {
        stakeStarOwner,
        stakeStarPublic,
        stakeStarETH,
        otherAccount,
        stakeStarProviderManager,
        ssvToken,
        stakeStarManager,
        validatorParams,
        stakeStarRegistry,
        stakeStarRegistryManager,
        stakeStarTreasury,
        owner,
        hre,
      } = await loadFixture(deployStakeStarFixture);

      const thirtyTwoEthers = hre.ethers.utils.parseEther("32");

      await expect(
        stakeStarPublic.stake({ value: thirtyTwoEthers })
      ).to.changeTokenBalance(stakeStarETH, otherAccount, thirtyTwoEthers);

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      for (const operatorId of validatorParams.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }
      await stakeStarManager.createValidator(
        validatorParams,
        await ssvToken.balanceOf(stakeStarManager.address)
      );
      await stakeStarRegistryManager.confirmActivatingValidator(
        validatorParams.publicKey
      );

      await stakeStarTreasury.setCommission(50_000); // 50%

      const baseTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;

      await stakeStarProviderManager.commitStakingSurplus(
        0,
        baseTimestamp - 1000
      );
      await stakeStarOwner.commitStakingSurplus();

      expect(await stakeStarOwner.stakingSurplusA()).to.eq(0);
      expect(await stakeStarOwner.stakingSurplusB()).to.eq(0);
      expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(0);

      await stakeStarProviderManager.commitStakingSurplus(0, baseTimestamp);
      await stakeStarOwner.commitStakingSurplus();

      expect(await stakeStarOwner.stakingSurplusA()).to.eq(0);
      expect(await stakeStarOwner.stakingSurplusB()).to.eq(0);
      expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(0);

      await stakeStarProviderManager.commitStakingSurplus(
        100,
        baseTimestamp + 1000
      );
      await stakeStarOwner.commitStakingSurplus();

      expect(await stakeStarOwner.stakingSurplusA()).to.eq(0);
      expect(await stakeStarOwner.stakingSurplusB()).to.eq(50);
      expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(50);

      await stakeStarProviderManager.commitStakingSurplus(
        120,
        baseTimestamp + 2000
      );
      await stakeStarOwner.commitStakingSurplus();

      expect(await stakeStarOwner.stakingSurplusA()).to.eq(50);
      expect(await stakeStarOwner.stakingSurplusB()).to.eq(60);
      expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(60);

      await stakeStarProviderManager.commitStakingSurplus(
        10,
        baseTimestamp + 3000
      );
      await stakeStarOwner.commitStakingSurplus();

      expect(await stakeStarOwner.stakingSurplusA()).to.eq(60);
      expect(await stakeStarOwner.stakingSurplusB()).to.eq(5);
      expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(5);

      await stakeStarProviderManager.commitStakingSurplus(
        -120,
        baseTimestamp + 4000
      );
      await stakeStarOwner.commitStakingSurplus();

      expect(await stakeStarOwner.stakingSurplusA()).to.eq(5);
      expect(await stakeStarOwner.stakingSurplusB()).to.eq(-120);
      expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(0);
    });
  });
});
