import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

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

    return { stakeStar, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { stakeStar, owner } = await loadFixture(deployStakeStarFixture);

      expect(await stakeStar.hasRole(await stakeStar.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should set the right owner for ReceiptToken", async function () {
      const { stakeStar } = await loadFixture(deployStakeStarFixture);

      const ERC20 = await ethers.getContractFactory("ReceiptToken");
      const receiptToken = await ERC20.attach(await stakeStar.receiptToken());

      expect(await receiptToken.hasRole(await receiptToken.DEFAULT_ADMIN_ROLE(), stakeStar.address)).to.equal(true);
    });
  });

});
