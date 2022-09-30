import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  addressesFor,
  Environment,
  generateValidatorParams,
  operatorIdsFor,
  operatorPublicKeysFor,
  RANDOM_PRIVATE_KEY,
} from "../scripts/utils";

describe("StakeStar", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakeStarFixture() {
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const addresses = addressesFor(chainId, Environment.LOCALNET);

    console.log(`Chain ID ${chainId}`);

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    console.log(`Deployer ${owner.address}`);

    const StakeStarRegistry = await ethers.getContractFactory(
      "StakeStarRegistry"
    );
    const stakeStarRegistry = await upgrades.deployProxy(StakeStarRegistry);
    await stakeStarRegistry.deployed();

    const StakeStar = await ethers.getContractFactory("StakeStar");
    const stakeStar = await upgrades.deployProxy(StakeStar, [
      addresses.depositContract,
      addresses.ssvNetwork,
      addresses.ssvToken,
      stakeStarRegistry.address,
    ]);
    await stakeStar.deployed();
    const stakeStarPublic = stakeStar.connect(otherAccount);

    await stakeStar.grantRole(await stakeStar.MANAGER_ROLE(), owner.address);

    await stakeStarRegistry.grantRole(
      await stakeStarRegistry.STAKE_STAR_ROLE(),
      stakeStar.address
    );

    const StakeStarETH = await ethers.getContractFactory("StakeStarETH");
    const stakeStarETH = await StakeStarETH.attach(
      await stakeStar.stakeStarETH()
    );

    const StakeStarRewards = await ethers.getContractFactory(
      "StakeStarRewards"
    );
    const stakeStarRewards = await StakeStarRewards.attach(
      await stakeStar.stakeStarRewards()
    );

    const ERC20 = await ethers.getContractFactory("ERC20");
    const ssvToken = await ERC20.attach(addresses.ssvToken);

    return {
      chainId,
      stakeStar,
      stakeStarRegistry,
      stakeStarPublic,
      stakeStarETH,
      stakeStarRewards,
      ssvToken,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { stakeStar, owner } = await loadFixture(deployStakeStarFixture);

      expect(
        await stakeStar.hasRole(
          await stakeStar.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
    });

    it("Should set the right manager", async function () {
      const { stakeStar, owner } = await loadFixture(deployStakeStarFixture);

      expect(
        await stakeStar.hasRole(await stakeStar.MANAGER_ROLE(), owner.address)
      ).to.equal(true);
    });

    it("Should set the right owner for ssETH", async function () {
      const { stakeStar, stakeStarETH } = await loadFixture(
        deployStakeStarFixture
      );
      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.STAKE_STAR_ROLE(),
          stakeStar.address
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
      const { stakeStar, stakeStarPublic, stakeStarETH, otherAccount } =
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

      await stakeStar.applyPenalties(1);

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

  describe("CreateValidator", function () {
    it("Should create a validator", async function () {
      const { chainId, stakeStar, stakeStarRewards, ssvToken, owner } =
        await loadFixture(deployStakeStarFixture);

      await owner.sendTransaction({
        to: stakeStar.address,
        value: ethers.utils.parseEther("99"),
      });
      await ssvToken
        .connect(owner)
        .transfer(stakeStar.address, await ssvToken.balanceOf(owner.address));

      const validatorParams = await generateValidatorParams(
        RANDOM_PRIVATE_KEY,
        operatorPublicKeysFor(chainId),
        operatorIdsFor(chainId),
        stakeStarRewards.address
      );

      await stakeStar.createValidator(
        validatorParams,
        await ssvToken.balanceOf(stakeStar.address)
      );
    });
  });
});
