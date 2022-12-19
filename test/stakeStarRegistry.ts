import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./fixture";
import { Wallet } from "ethers";
import { ZERO_BYTES_STRING } from "../scripts/constants";
import { ValidatorStatus } from "../scripts/types";

describe("StakeStarRegistry", function () {
  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      const { stakeStarPublic, stakeStarRegistry, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await stakeStarRegistry.hasRole(
          await stakeStarRegistry.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
      expect(
        await stakeStarRegistry.hasRole(
          await stakeStarRegistry.DEFAULT_ADMIN_ROLE(),
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await stakeStarRegistry.hasRole(
          await stakeStarRegistry.STAKE_STAR_ROLE(),
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await stakeStarRegistry.hasRole(
          await stakeStarRegistry.STAKE_STAR_ROLE(),
          owner.address
        )
      ).to.equal(false);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow call methods without corresponding roles", async function () {
      const { stakeStarRegistry, validatorParams, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarRegistry.connect(otherAccount).addOperatorToAllowList(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarRegistry.DEFAULT_ADMIN_ROLE()}`
      );
      await expect(
        stakeStarRegistry.connect(otherAccount).removeOperatorFromAllowList(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarRegistry.DEFAULT_ADMIN_ROLE()}`
      );

      await expect(
        stakeStarRegistry
          .connect(owner)
          .createValidator(validatorParams.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarRegistry.STAKE_STAR_ROLE()}`
      );
      await expect(
        stakeStarRegistry
          .connect(owner)
          .exitValidator(validatorParams.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarRegistry.STAKE_STAR_ROLE()}`
      );

      await expect(
        stakeStarRegistry.activateValidator(validatorParams.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarRegistry.MANAGER_ROLE()}`
      );
      await expect(
        stakeStarRegistry.verifyValidatorExit(validatorParams.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarRegistry.MANAGER_ROLE()}`
      );
    });
  });

  describe("AllowList", function () {
    it("Should add operator to the allow list", async function () {
      const { stakeStarRegistry } = await loadFixture(deployStakeStarFixture);

      const operatorId = 1;

      await expect(stakeStarRegistry.addOperatorToAllowList(operatorId))
        .to.emit(stakeStarRegistry, "AddOperatorToAllowList")
        .withArgs(operatorId);

      await expect(
        stakeStarRegistry.addOperatorToAllowList(operatorId)
      ).to.be.revertedWith("operator already added");

      expect(await stakeStarRegistry.allowListOfOperators(operatorId)).to.equal(
        true
      );
    });

    it("Should remove operator from the allow list", async function () {
      const { stakeStarRegistry } = await loadFixture(deployStakeStarFixture);

      const operatorId = 1;

      await expect(
        stakeStarRegistry.removeOperatorFromAllowList(operatorId)
      ).to.be.revertedWith("operator not added");

      await stakeStarRegistry.addOperatorToAllowList(operatorId);

      await expect(stakeStarRegistry.removeOperatorFromAllowList(operatorId))
        .to.emit(stakeStarRegistry, "RemoveOperatorFromAllowList")
        .withArgs(operatorId);

      expect(await stakeStarRegistry.allowListOfOperators(operatorId)).to.equal(
        false
      );
    });

    it("Should verify operators using the allow list", async function () {
      const { stakeStarRegistry, owner } = await loadFixture(
        deployStakeStarFixture
      );

      const operatorId_1 = 1;
      const operatorId_2 = 2;

      expect(await stakeStarRegistry.verifyOperators([operatorId_1])).to.be
        .false;
      await stakeStarRegistry
        .connect(owner)
        .addOperatorToAllowList(operatorId_1);
      expect(await stakeStarRegistry.verifyOperators([operatorId_1])).to.be
        .true;
      await stakeStarRegistry
        .connect(owner)
        .removeOperatorFromAllowList(operatorId_1);
      expect(await stakeStarRegistry.verifyOperators([operatorId_1])).to.be
        .false;

      await stakeStarRegistry
        .connect(owner)
        .addOperatorToAllowList(operatorId_1);
      await stakeStarRegistry
        .connect(owner)
        .addOperatorToAllowList(operatorId_2);
      expect(
        await stakeStarRegistry.verifyOperators([operatorId_1, operatorId_2])
      ).to.be.true;
      await stakeStarRegistry
        .connect(owner)
        .removeOperatorFromAllowList(operatorId_1);
      expect(
        await stakeStarRegistry.verifyOperators([operatorId_1, operatorId_2])
      ).to.be.false;
    });
  });

  describe("Validators", function () {
    it("Should create validator", async function () {
      const { stakeStarRegistry, owner } = await loadFixture(
        deployStakeStarFixture
      );

      await stakeStarRegistry
        .connect(owner)
        .grantRole(await stakeStarRegistry.STAKE_STAR_ROLE(), owner.address);

      const publicKey1 = Wallet.createRandom().publicKey;
      const publicKey2 = Wallet.createRandom().publicKey;

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.MISSING
      );

      await expect(stakeStarRegistry.createValidator(publicKey1))
        .to.emit(stakeStarRegistry, "ValidatorStatusChange")
        .withArgs(publicKey1, ValidatorStatus.MISSING, ValidatorStatus.PENDING);

      await expect(
        stakeStarRegistry.createValidator(publicKey1)
      ).to.be.revertedWith("validator status not MISSING");

      await stakeStarRegistry.createValidator(publicKey2);

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.PENDING
      );
      expect(await stakeStarRegistry.validatorStatuses(publicKey2)).to.equal(
        ValidatorStatus.PENDING
      );

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.MISSING)
      ).to.eql([ZERO_BYTES_STRING, ZERO_BYTES_STRING]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.MISSING
        )
      ).to.equal(0);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.PENDING)
      ).to.eql([publicKey1, publicKey2]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.PENDING
        )
      ).to.equal(2);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.EXITED)
      ).to.eql([ZERO_BYTES_STRING, ZERO_BYTES_STRING]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(ValidatorStatus.EXITED)
      ).to.equal(0);
    });

    it("Should verify validator creation", async function () {
      const { stakeStarRegistry, stakeStarRegistryManager, owner } =
        await loadFixture(deployStakeStarFixture);

      await stakeStarRegistry
        .connect(owner)
        .grantRole(await stakeStarRegistry.STAKE_STAR_ROLE(), owner.address);

      const publicKey1 = Wallet.createRandom().publicKey;

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.MISSING
      );

      await expect(
        stakeStarRegistryManager.activateValidator(publicKey1)
      ).to.be.revertedWith("validator status not PENDING");

      await stakeStarRegistry.createValidator(publicKey1);

      await expect(stakeStarRegistryManager.activateValidator(publicKey1))
        .to.emit(stakeStarRegistry, "ValidatorStatusChange")
        .withArgs(publicKey1, ValidatorStatus.PENDING, ValidatorStatus.ACTIVE);

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.ACTIVE
      );
      await expect(
        stakeStarRegistryManager.activateValidator(publicKey1)
      ).to.be.revertedWith("validator status not PENDING");

      await stakeStarRegistry.exitValidator(publicKey1);
      await expect(
        stakeStarRegistryManager.activateValidator(publicKey1)
      ).to.be.revertedWith("validator status not PENDING");
    });

    it("Should exit validator", async function () {
      const { stakeStarRegistry, stakeStarRegistryManager, owner } =
        await loadFixture(deployStakeStarFixture);

      await stakeStarRegistry.grantRole(
        await stakeStarRegistry.STAKE_STAR_ROLE(),
        owner.address
      );

      const publicKey1 = Wallet.createRandom().publicKey;
      const publicKey2 = Wallet.createRandom().publicKey;
      const publicKey3 = Wallet.createRandom().publicKey;

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.MISSING
      );

      await expect(
        stakeStarRegistry.exitValidator(publicKey1)
      ).to.be.revertedWith("validator status not ACTIVE");

      await expect(stakeStarRegistry.createValidator(publicKey1));
      await expect(stakeStarRegistry.createValidator(publicKey2));
      await expect(stakeStarRegistry.createValidator(publicKey3));

      await stakeStarRegistryManager.activateValidator(publicKey1);
      await stakeStarRegistryManager.activateValidator(publicKey2);
      await stakeStarRegistryManager.activateValidator(publicKey3);

      await expect(stakeStarRegistry.exitValidator(publicKey1))
        .to.emit(stakeStarRegistry, "ValidatorStatusChange")
        .withArgs(publicKey1, ValidatorStatus.ACTIVE, ValidatorStatus.EXITING);

      await expect(
        stakeStarRegistry.exitValidator(publicKey1)
      ).to.be.revertedWith("validator status not ACTIVE");

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.EXITING
      );

      await stakeStarRegistry.exitValidator(publicKey2);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.MISSING)
      ).to.eql([ZERO_BYTES_STRING, ZERO_BYTES_STRING, ZERO_BYTES_STRING]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.MISSING
        )
      ).to.equal(0);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.ACTIVE)
      ).to.eql([ZERO_BYTES_STRING, ZERO_BYTES_STRING, publicKey3]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(ValidatorStatus.ACTIVE)
      ).to.equal(1);

      expect(await stakeStarRegistry.getValidatorPublicKeysLength()).to.equal(
        3
      );

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.EXITING)
      ).to.eql([publicKey1, publicKey2, ZERO_BYTES_STRING]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.EXITING
        )
      ).to.equal(2);
    });

    it("Should verify validator exit", async function () {
      const { stakeStarRegistry, stakeStarRegistryManager, owner } =
        await loadFixture(deployStakeStarFixture);

      await stakeStarRegistry.grantRole(
        await stakeStarRegistry.STAKE_STAR_ROLE(),
        owner.address
      );

      const publicKey1 = Wallet.createRandom().publicKey;

      await stakeStarRegistry.createValidator(publicKey1);
      await stakeStarRegistryManager.activateValidator(publicKey1);

      await expect(
        stakeStarRegistryManager.verifyValidatorExit(publicKey1)
      ).to.be.revertedWith("validator status not EXITING");

      await stakeStarRegistry.exitValidator(publicKey1);

      await expect(stakeStarRegistryManager.verifyValidatorExit(publicKey1))
        .to.emit(stakeStarRegistry, "ValidatorStatusChange")
        .withArgs(publicKey1, ValidatorStatus.EXITING, ValidatorStatus.EXITED);

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.EXITED
      );
    });
  });

  describe("ChainLinkInterface", function () {
    it("getPoRAddressListLength", async function () {
      const { stakeStarRegistry, stakeStarRegistryManager, owner } =
        await loadFixture(deployStakeStarFixture);

      await stakeStarRegistry
        .connect(owner)
        .grantRole(await stakeStarRegistry.STAKE_STAR_ROLE(), owner.address);

      const publicKey1 = Wallet.createRandom().publicKey;
      const publicKey2 = Wallet.createRandom().publicKey;
      const publicKey3 = Wallet.createRandom().publicKey;

      expect(await stakeStarRegistry.getPoRAddressListLength()).to.equal(0);
      await stakeStarRegistry.createValidator(publicKey1);
      await stakeStarRegistryManager.activateValidator(publicKey1);
      expect(await stakeStarRegistry.getPoRAddressListLength()).to.equal(1);
      await stakeStarRegistry.createValidator(publicKey2);
      await stakeStarRegistryManager.activateValidator(publicKey2);
      expect(await stakeStarRegistry.getPoRAddressListLength()).to.equal(2);
      await stakeStarRegistry.createValidator(publicKey3);
      await stakeStarRegistryManager.activateValidator(publicKey3);
      expect(await stakeStarRegistry.getPoRAddressListLength()).to.equal(3);

      await expect(stakeStarRegistry.exitValidator(publicKey1));
      expect(await stakeStarRegistry.getPoRAddressListLength()).to.equal(2);
      await expect(stakeStarRegistry.exitValidator(publicKey2));
      expect(await stakeStarRegistry.getPoRAddressListLength()).to.equal(1);
      await expect(stakeStarRegistry.exitValidator(publicKey3));
      expect(await stakeStarRegistry.getPoRAddressListLength()).to.equal(0);
    });

    it("getPoRAddressList", async function () {
      const { stakeStarRegistry, stakeStarRegistryManager, owner } =
        await loadFixture(deployStakeStarFixture);
      const stakeStarRegistryOwner = stakeStarRegistry;

      await stakeStarRegistry
        .connect(owner)
        .grantRole(await stakeStarRegistry.STAKE_STAR_ROLE(), owner.address);

      expect(await stakeStarRegistry.getPoRAddressList(0, 1)).to.eql([]);

      const publicKey1 = Wallet.createRandom().publicKey;
      const publicKey2 = Wallet.createRandom().publicKey;
      const publicKey3 = Wallet.createRandom().publicKey;
      const publicKey4 = Wallet.createRandom().publicKey;

      await stakeStarRegistryOwner.createValidator(publicKey1);
      await stakeStarRegistryOwner.createValidator(publicKey2);
      await stakeStarRegistryOwner.createValidator(publicKey3);
      await stakeStarRegistryOwner.createValidator(publicKey4);

      await stakeStarRegistryManager.activateValidator(publicKey1);
      await stakeStarRegistryManager.activateValidator(publicKey2);
      await stakeStarRegistryManager.activateValidator(publicKey3);
      await stakeStarRegistryManager.activateValidator(publicKey4);

      expect(await stakeStarRegistry.getPoRAddressList(1, 0)).to.eql([]);
      expect(await stakeStarRegistry.getPoRAddressList(100, 100)).to.eql([]);

      expect(await stakeStarRegistry.getPoRAddressList(0, 1)).to.eql([
        publicKey1,
        publicKey2,
      ]);
      expect(await stakeStarRegistry.getPoRAddressList(0, 3)).to.eql([
        publicKey1,
        publicKey2,
        publicKey3,
        publicKey4,
      ]);
      expect(await stakeStarRegistry.getPoRAddressList(1, 3)).to.eql([
        publicKey2,
        publicKey3,
        publicKey4,
      ]);
      expect(await stakeStarRegistry.getPoRAddressList(2, 3)).to.eql([
        publicKey3,
        publicKey4,
      ]);
      expect(await stakeStarRegistry.getPoRAddressList(0, 10)).to.eql([
        publicKey1,
        publicKey2,
        publicKey3,
        publicKey4,
      ]);
      expect(await stakeStarRegistry.getPoRAddressList(0, 0)).to.eql([
        publicKey1,
      ]);
      expect(await stakeStarRegistry.getPoRAddressList(1, 1)).to.eql([
        publicKey2,
      ]);
      expect(await stakeStarRegistry.getPoRAddressList(2, 2)).to.eql([
        publicKey3,
      ]);
      expect(await stakeStarRegistry.getPoRAddressList(3, 3)).to.eql([
        publicKey4,
      ]);
    });
  });
});
