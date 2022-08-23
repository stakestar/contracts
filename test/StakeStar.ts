import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers, upgrades} from "hardhat";

describe("StakeStar", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakeStarFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const StakeStar = await ethers.getContractFactory("StakeStar");
    const stakeStar = await upgrades.deployProxy(StakeStar);
    await stakeStar.deployed();
    const stakeStarPublic = stakeStar.connect(otherAccount);

    const ERC20 = await ethers.getContractFactory("ReceiptToken");
    const receiptToken = await ERC20.attach(await stakeStar.receiptToken());

    const StakeStarRewards = await ethers.getContractFactory("StakeStarRewards");
    const stakeStarRewards = await StakeStarRewards.attach(await stakeStar.stakeStarRewards());

    return {stakeStar, stakeStarPublic, receiptToken, stakeStarRewards, owner, otherAccount};
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const {stakeStar, owner} = await loadFixture(deployStakeStarFixture);

      expect(await stakeStar.hasRole(await stakeStar.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should set the right owner for ReceiptToken", async function () {
      const {stakeStar} = await loadFixture(deployStakeStarFixture);

      const ERC20 = await ethers.getContractFactory("ReceiptToken");
      const receiptToken = await ERC20.attach(await stakeStar.receiptToken());

      expect(await receiptToken.hasRole(await receiptToken.DEFAULT_ADMIN_ROLE(), stakeStar.address)).to.equal(true);
    });
  });

  describe("Stake", function () {
    it("Should send ETH to the contract", async function () {
      const {stakeStarPublic, otherAccount} = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeEtherBalances([otherAccount, stakeStarPublic], [-1, 1]);
    });

    it("Should mint msg.value of ReceiptToken if rate is 1:1", async function () {
      const {stakeStarPublic, receiptToken, otherAccount} = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(receiptToken, otherAccount, 1);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(receiptToken, otherAccount, 1);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(receiptToken, otherAccount, 1);

      expect(await receiptToken.rate()).to.equal('1000000000000000000');
      expect(await receiptToken.totalSupply()).to.equal('3');
    });

    it("Should mint msg.value / 2 of ReceiptToken if rate is 1:2", async function () {
      const {stakeStar, stakeStarPublic, receiptToken, otherAccount} = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(receiptToken, otherAccount, 1);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(receiptToken, otherAccount, 1);

      await stakeStar.applyPenalties(1);

      expect(await receiptToken.rate()).to.equal('500000000000000000');
      expect(await receiptToken.totalSupply()).to.equal('2');

      await expect(
        stakeStarPublic.stake({value: 2})
      ).to.changeTokenBalance(receiptToken, otherAccount, 1);
    });

    it("Should mint msg.value * 2 of ReceiptToken if rate is 2:1", async function () {
      const {stakeStarPublic, receiptToken, stakeStarRewards, otherAccount} = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(receiptToken, otherAccount, 1);

      await expect(
        otherAccount.sendTransaction({to: stakeStarRewards.address, value: 1})
      ).to.changeEtherBalances([otherAccount, stakeStarRewards],[-1, 1]);

      await expect(
        stakeStarPublic.applyRewards()
      ).to.changeEtherBalances([stakeStarRewards, stakeStarPublic],[-1, 1]);

      expect(await receiptToken.rate()).to.equal('2000000000000000000');
      expect(await receiptToken.totalSupply()).to.equal('1');

      await expect(
        stakeStarPublic.stake({value: 1})
      ).to.changeTokenBalance(receiptToken, otherAccount, 2);
    });
  });

});
