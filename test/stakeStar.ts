import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  currentNetwork,
  generateValidatorParams,
  OPERATOR_IDS,
  OPERATOR_PUBLIC_KEYS,
  RANDOM_PRIVATE_KEY,
  ZERO,
} from "../scripts/utils";
import { deployStakeStarFixture } from "./fixture";

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

  describe("Stake", function () {
    it("Should send ETH to the contract", async function () {
      const { stakeStarPublic, stakeStarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeEtherBalances(
        [otherAccount, stakeStarPublic],
        [-1, 1]
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );
    });
  });

  describe("Unstake", function () {
    it("Should create pendingUnstake", async function () {
      const { stakeStarPublic, otherAccount, stakeStarETH } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeAmount = ethers.utils.parseEther("2");
      await stakeStarPublic.stake({ value: stakeAmount });
      const ssEthAmount = await stakeStarETH.balanceOf(otherAccount.address);

      expect(await stakeStarETH.totalSupply()).to.equal(ssEthAmount);

      const unstakeAmount = stakeAmount.div(2);
      const shouldBeBurnt = ssEthAmount.div(2);

      await expect(
        stakeStarPublic.unstake(unstakeAmount)
      ).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        shouldBeBurnt.mul(-1)
      );

      expect(await stakeStarETH.totalSupply()).to.equal(
        ssEthAmount.sub(shouldBeBurnt)
      );
      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(unstakeAmount);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(unstakeAmount);
    });
  });

  describe("Claim", function () {
    it("Should finish pendingUnstake and send Ether", async function () {
      const { stakeStarPublic, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeAmount = ethers.utils.parseEther("2");
      const unstakeAmount = stakeAmount.div(2);

      await stakeStarPublic.stake({ value: stakeAmount });
      await stakeStarPublic.unstake(unstakeAmount);

      await expect(stakeStarPublic.claim()).to.changeEtherBalances(
        [stakeStarPublic.address, otherAccount.address],
        [unstakeAmount.mul(-1), unstakeAmount]
      );

      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(ZERO);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(ZERO);
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
        hre,
        stakeStarManager,
        stakeStarRewards,
        ssvToken,
        owner,
        manager,
      } = await loadFixture(deployStakeStarFixture);

      await manager.sendTransaction({
        to: stakeStarManager.address,
        value: ethers.utils.parseEther("99"),
      });
      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );

      const validatorParams = await generateValidatorParams(
        RANDOM_PRIVATE_KEY,
        OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
        OPERATOR_IDS[currentNetwork(hre)],
        stakeStarRewards.address
      );

      await stakeStarManager.createValidator(
        validatorParams,
        await ssvToken.balanceOf(stakeStarManager.address)
      );
    });
  });
});
