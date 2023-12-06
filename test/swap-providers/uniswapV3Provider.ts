import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../test-helpers/fixture";
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
        uniswapV3Provider.connect(otherAccount).swap(1, 0)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.TREASURY_ROLE
        }`
      );
    });
  });

  describe("Setters", function () {
    describe("setAddresses", function () {
      it("Should setAddresses", async function () {
        const { uniswapV3Provider, addresses, uniswapHelper } =
          await loadFixture(deployStakeStarFixture);

        await expect(
          uniswapV3Provider.setAddresses(
            addresses.swapRouter,
            addresses.quoter,
            uniswapHelper.address,
            addresses.weth,
            addresses.ssvToken,
            addresses.pool
          )
        )
          .to.emit(uniswapV3Provider, "SetAddresses")
          .withArgs(
            addresses.swapRouter,
            addresses.quoter,
            uniswapHelper.address,
            addresses.weth,
            addresses.ssvToken,
            addresses.pool
          );

        expect(await uniswapV3Provider.swapRouter()).to.equal(
          addresses.swapRouter
        );
        expect(await uniswapV3Provider.quoter()).to.equal(addresses.quoter);
        expect(await uniswapV3Provider.uniswapHelper()).to.equal(
          uniswapHelper.address
        );
        expect(await uniswapV3Provider.wETH()).to.equal(addresses.weth);
        expect(await uniswapV3Provider.ssvToken()).to.equal(addresses.ssvToken);
        expect(await uniswapV3Provider.pool()).to.equal(addresses.pool);
      });
    });

    describe("setParameters", function () {
      it("Should setParameters", async function () {
        const { uniswapV3Provider } = await loadFixture(deployStakeStarFixture);

        expect(await uniswapV3Provider.poolFee()).to.equal(0);
        expect(await uniswapV3Provider.slippage()).to.equal(0);
        expect(await uniswapV3Provider.twapInterval()).to.equal(0);
        expect(await uniswapV3Provider.minETHLiquidity()).to.equal(0);

        await expect(uniswapV3Provider.setParameters(1, 2, 3, 4))
          .to.emit(uniswapV3Provider, "SetParameters")
          .withArgs(1, 2, 3, 4);

        expect(await uniswapV3Provider.poolFee()).to.equal(1);
        expect(await uniswapV3Provider.slippage()).to.equal(2);
        expect(await uniswapV3Provider.twapInterval()).to.equal(3);
        expect(await uniswapV3Provider.minETHLiquidity()).to.equal(4);
      });
    });
  });
});
