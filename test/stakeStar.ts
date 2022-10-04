import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  ADDRESSES,
  currentNetwork,
  generateValidatorParams,
  OPERATOR_IDS,
  OPERATOR_PUBLIC_KEYS,
  RANDOM_PRIVATE_KEY,
  ZERO,
} from "../scripts/utils";

describe("StakeStar", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakeStarFixture() {
    const hre = require("hardhat");
    const addresses = ADDRESSES[currentNetwork(hre)];

    // Contracts are deployed using the first signer/account by default
    const [owner, manager, otherAccount] = await ethers.getSigners();

    console.log(`Owner ${owner.address}`);
    console.log(`Manager ${manager.address}`);

    const StakeStarRegistry = await ethers.getContractFactory(
      "StakeStarRegistry"
    );
    const stakeStarRegistry = await upgrades.deployProxy(StakeStarRegistry);
    await stakeStarRegistry.deployed();

    const StakeStar = await ethers.getContractFactory("StakeStar");
    const stakeStarOwner = await upgrades.deployProxy(StakeStar, [
      addresses.depositContract,
      addresses.ssvNetwork,
      addresses.ssvToken,
      stakeStarRegistry.address,
    ]);
    await stakeStarOwner.deployed();
    const stakeStarManager = stakeStarOwner.connect(manager);
    const stakeStarPublic = stakeStarOwner.connect(otherAccount);

    await stakeStarOwner.grantRole(
      await stakeStarOwner.MANAGER_ROLE(),
      manager.address
    );
    await stakeStarRegistry.grantRole(
      await stakeStarRegistry.STAKE_STAR_ROLE(),
      stakeStarOwner.address
    );

    const StakeStarETH = await ethers.getContractFactory("StakeStarETH");
    const stakeStarETH = await StakeStarETH.attach(
      await stakeStarOwner.stakeStarETH()
    );

    const StakeStarRewards = await ethers.getContractFactory(
      "StakeStarRewards"
    );
    const stakeStarRewards = await StakeStarRewards.attach(
      await stakeStarOwner.stakeStarRewards()
    );

    const ERC20 = await ethers.getContractFactory("ERC20");
    const ssvToken = await ERC20.attach(addresses.ssvToken);

    return {
      hre,
      stakeStarOwner,
      stakeStarManager,
      stakeStarPublic,
      stakeStarRegistry,
      stakeStarETH,
      stakeStarRewards,
      ssvToken,
      owner,
      manager,
      otherAccount,
    };
  }

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
      const { stakeStarPublic, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeEtherBalances(
        [otherAccount, stakeStarPublic],
        [-1, 1]
      );
    });

    it("Should mint msg.value of ssETH if rate is 1:1", async function () {
      const { stakeStarPublic, stakeStarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      expect(await stakeStarETH.rate()).to.equal("1000000000000000000");
      expect(await stakeStarETH.totalSupply()).to.equal("3");
    });

    it("Should mint msg.value * 2 of ssETH if rate 0.5", async function () {
      const { stakeStarOwner, stakeStarPublic, stakeStarETH, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await stakeStarOwner.applyPenalties(1);

      expect(await stakeStarETH.rate()).to.equal("500000000000000000");
      expect(await stakeStarETH.totalSupply()).to.equal("2");

      await expect(stakeStarPublic.stake({ value: 2 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        4
      );
    });

    it("Should mint msg.value / 2 of ssETH if rate is 2", async function () {
      const { stakeStarPublic, stakeStarETH, stakeStarRewards, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(
        otherAccount.sendTransaction({ to: stakeStarRewards.address, value: 1 })
      ).to.changeEtherBalances([otherAccount, stakeStarRewards], [-1, 1]);

      await expect(stakeStarPublic.applyRewards()).to.changeEtherBalances(
        [stakeStarRewards, stakeStarPublic],
        [-1, 1]
      );

      expect(await stakeStarETH.rate()).to.equal("2000000000000000000");
      expect(await stakeStarETH.totalSupply()).to.equal("1");

      await expect(stakeStarPublic.stake({ value: 4 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        2
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
