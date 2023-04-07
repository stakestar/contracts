import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../test-helpers/fixture";
import { generateValidatorParams } from "../test-helpers/wrappers";
import {
  GENESIS_FORK_VERSIONS,
  OPERATOR_PUBLIC_KEYS,
  RANDOM_PRIVATE_KEY_2,
} from "../../scripts/constants";
import { currentNetwork } from "../../scripts/helpers";
import hre from "hardhat";

describe("Utils", function () {
  describe("addressToWithdrawalCredentials", function () {
    it("Should convert address to credentials", async function () {
      const { withdrawalAddress, utilsMock, validatorParams1 } =
        await loadFixture(deployStakeStarFixture);

      const { bytesToHex } = await import("@stakestar/lib");

      // @ts-ignore
      const expectedHex = bytesToHex(validatorParams1.withdrawalCredentials);

      expect(
        await utilsMock.addressToWithdrawalCredentials(
          withdrawalAddress.address
        )
      ).to.eq(expectedHex);
    });
  });

  describe("compareBytes", function () {
    it("Should compare two byte arrays", async function () {
      const { validatorParams1, utilsMock, operatorIDs, feeRecipient } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await utilsMock.compareBytes(
          validatorParams1.withdrawalCredentials,
          validatorParams1.withdrawalCredentials
        )
      ).to.eq(true);

      const validatorParams3 = await generateValidatorParams(
        RANDOM_PRIVATE_KEY_2,
        OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
        operatorIDs,
        feeRecipient.address,
        GENESIS_FORK_VERSIONS[currentNetwork(hre)]
      );

      expect(
        await utilsMock.compareBytes(
          validatorParams1.withdrawalCredentials,
          validatorParams3.withdrawalCredentials
        )
      ).to.eq(false);
    });
  });
});
