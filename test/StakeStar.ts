import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";

import {addressesFor, operatorIdsFor, operatorPublicKeysFor} from "../scripts/utils/constants";
import {HDNode} from "ethers/lib/utils";
import {generateValidatorParams} from "../scripts/utils/helpers";

describe("StakeStar", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakeStarFixture() {
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const addresses = addressesFor(chainId);

    console.log(`Chain ID ${chainId}`);

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const StakeStarRegistry = await ethers.getContractFactory("StakeStarRegistry");
    const stakeStarRegistry = await upgrades.deployProxy(StakeStarRegistry);
    await stakeStarRegistry.deployed();

    const StakeStar = await ethers.getContractFactory("StakeStar");
    const stakeStar = await upgrades.deployProxy(StakeStar, [addresses.depositContract, addresses.ssvNetwork, addresses.ssvToken, stakeStarRegistry.address]);
    await stakeStar.deployed();
    const stakeStarPublic = stakeStar.connect(otherAccount);

    const StakeStarETH = await ethers.getContractFactory("StakeStarETH");
    const stakeStarETH = await StakeStarETH.attach(await stakeStar.stakeStarETH());

    const StakeStarRewards = await ethers.getContractFactory("StakeStarRewards");
    const stakeStarRewards = await StakeStarRewards.attach(await stakeStar.stakeStarRewards());

    return {chainId, stakeStar, stakeStarPublic, stakeStarETH: stakeStarETH, stakeStarRewards, owner, otherAccount};
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const {stakeStar, owner} = await loadFixture(deployStakeStarFixture);

      expect(await stakeStar.hasRole(await stakeStar.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should set the right owner for ssETH", async function () {
      const {stakeStar, stakeStarETH} = await loadFixture(deployStakeStarFixture);
      expect(await stakeStarETH.hasRole(await stakeStarETH.DEFAULT_ADMIN_ROLE(), stakeStar.address)).to.equal(true);
    });
  });

  describe("Stake", function () {
    it("Should send ETH to the contract", async function () {
      const {stakeStarPublic, otherAccount} = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeEtherBalances([otherAccount, stakeStarPublic], [-1, 1]);
    });

    it("Should mint msg.value of ssETH if rate is 1:1", async function () {
      const {stakeStarPublic, stakeStarETH, otherAccount} = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(stakeStarETH, otherAccount, 1);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(stakeStarETH, otherAccount, 1);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(stakeStarETH, otherAccount, 1);

      expect(await stakeStarETH.rate()).to.equal('1000000000000000000');
      expect(await stakeStarETH.totalSupply()).to.equal('3');
    });

    it("Should mint msg.value * 2 of ssETH if rate 0.5", async function () {
      const {stakeStar, stakeStarPublic, stakeStarETH, otherAccount} = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(stakeStarETH, otherAccount, 1);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(stakeStarETH, otherAccount, 1);

      await stakeStar.applyPenalties(1);

      expect(await stakeStarETH.rate()).to.equal('500000000000000000');
      expect(await stakeStarETH.totalSupply()).to.equal('2');

      await expect(
        stakeStarPublic.stake({value: 2})
      ).to.changeTokenBalance(stakeStarETH, otherAccount, 4);
    });

    it("Should mint msg.value / 2 of ssETH if rate is 2", async function () {
      const {stakeStarPublic, stakeStarETH, stakeStarRewards, otherAccount} = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(stakeStarETH, otherAccount, 1);

      await expect(
        otherAccount.sendTransaction({to: stakeStarRewards.address, value: 1})
      ).to.changeEtherBalances([otherAccount, stakeStarRewards], [-1, 1]);

      await expect(
        stakeStarPublic.applyRewards()
      ).to.changeEtherBalances([stakeStarRewards, stakeStarPublic], [-1, 1]);

      expect(await stakeStarETH.rate()).to.equal('2000000000000000000');
      expect(await stakeStarETH.totalSupply()).to.equal('1');

      await expect(
        stakeStarPublic.stake({value: 4})
      ).to.changeTokenBalance(stakeStarETH, otherAccount, 2);
    });
  });

});
