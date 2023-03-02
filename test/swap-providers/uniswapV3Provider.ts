import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture";
import { ConstantsLib } from "../../scripts/constants";

describe("UniswapV3Provider", function () {
  describe("Deployment", function () {
    it("Should set the right DEFAULT_ADMIN_ROLE", async function () {
      const { uniswapV3Provider, stakeStarTreasury, otherAccount, owner } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await uniswapV3Provider.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          owner.address
        )
      ).to.equal(true);
      expect(
        await stakeStarTreasury.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await uniswapV3Provider.hasRole(
          ConstantsLib.TREASURY_ROLE,
          stakeStarTreasury.address
        )
      ).to.equal(true);
      expect(
        await uniswapV3Provider.hasRole(
          ConstantsLib.TREASURY_ROLE,
          owner.address
        )
      ).to.equal(false);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow call methods without corresponding roles", async function () {
      const { uniswapV3Provider, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        uniswapV3Provider
          .connect(otherAccount)
          .setAddresses(
            uniswapV3Provider.address,
            uniswapV3Provider.address,
            uniswapV3Provider.address,
            uniswapV3Provider.address,
            uniswapV3Provider.address,
            uniswapV3Provider.address
          )
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
      );
      await expect(
        uniswapV3Provider.connect(otherAccount).setParameters(1, 1, 1, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
      );
      await expect(
        uniswapV3Provider.connect(otherAccount).swap(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.TREASURY_ROLE
        }`
      );
    });
  });
});
