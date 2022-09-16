import {AbiCoder} from "@ethersproject/abi";
import {BigNumber, providers, Wallet} from "ethers";
import {DEFAULT_GENESIS_FORK_VERSION, generateDepositData, signingKey, split} from "@stakestar/lib";
import {addressesFor} from "./addresses";
import {StakeStar, StakeStar__factory} from "../../typechain-types";

const chainId = 5;
const operatorIds = [24, 312, 335, 50];
const operatorPubKeys = [
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBNW1idlV5Y0VqWlExQUxrLzY3TkQKRzhIWjJETTBMZTRxSXhXOFRFWjhwcFhRNDFhL29EMncrWlUzUVMzZE5EL2xQdlYzOG5sdFp2UVNQaXh1QkthZgpKK2VoemlFbjNwVWl3UWU1bWhuTnhvbUIyMXByUTNiTFYxNlBBSTEybjBIS2ZzYk4rcnVNYXpKTXBScGlqY0kxCkhjdlhwZUdXK2JZaFFVclVjWUMvU2ZiQkcvRHpkL1NlQkpvcjJvbjlJd0VaU1NFbXF5dndyQ1ltREQ2dlNrMS8KMVFEaU42L3JnejJ0UWJwMEZTckVML1lVQ2M1Qjc4UWZzbDNuNll6UlBDbTk2dWxSazdzempnSzRjOG8yVFJKUQpQa2VyREw3MTcydkNmVGNhOTRwYTlOeVU2OSsvUmZ5c3pORTRYTTJzOVQzbEpLNHVhdlNqV1NtZUFQdXk5Rjk0Ckp3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBM1J5dWpYeUxEcTl0aS9BQWdVSHYKc0VXQU90V3F5NW9BS2lmYWVkeGVUR2dWbnl2aUU2OXkyL2FLb0h0NHVPSXFDb0NyZzRsT3lKdHhsaHd4WWdBWQoyVGJMQXdqNUVLRUlMbjVoRWtVQVR2SGY0OEppbngzVzY5ME1DMk5TS2d6Qmh0NHhvdzE0V3FIenFqYzRlTTN1CnZiUFlxajkyNm1JMC9pd1F3S2p5a2RSM0g2akNIQlc1cXI3RjVjZzRVTUttUGs2dUo0RC9ZR2tpbTQ2SENaNEEKS0taL1VSZ2J6OFFMSSttaHRzV2Z5NXJxTGNFbUNGYzJCek1YNWFyamZMclFaTVZOU2tkVlZLanRmTTh2bWFrZgpIOVk5RWdIVGQyMm9qTTA2dDJBUitoMUJ1SXcyaytjM1d3dXpjVzY2QUxPMmJMbkgxV1VHSXRQZGFXK0xETjArClNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBMVc5TzFsTjl5ZXc4ZE9VV2FQSHUKb05oY3lkekh4RXNGVlhhazh6TzVxT1IxNXNOcDZFUzg1eGJrYWdaWDJCdGFIbUVIeGJaMWw1K3h6czFpMUpjcQp2MGMrVzNJdWJRaWVsM3BtYWdybUtpQ0dwOVNvY0NUR0ZWcG93UjA1eHovMUs5TUt2MnhUSmtKemJ3NEswREo2Ck8xZkxtczZuQTV5TVhNWGYvN084Mkk5MGNmc05UeEdLbjlEVGFhcC8rR01nVm1qSHliWXhCMkRaRzNmL3BGZkgKZlVvbHpsV0I0dFFxT0RDVTUyUVI0Mi96cG9XOGR2QVF4N2ZYL090SVBlSjdxd1REMkNvS1dHSHdrMjhFb2VoNAp0azB5akhNbS91dm1DOG54dTA0ZWUwSS9WU1hqdU9tL2sxSVRaMXlqaGM5SUdrd2daM2dvcDlpeWVzbmEzNVdBCjNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K",
    "LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBbm5vUHF0M0xZcGtGVDVleS9PanUKWlh6L2JkdVRkS2NISkZDQ3ArNmJWZDJobC9HRkd0YUs3VWQ2Qm1yaUZSUzBEMjNrbitaTytkeTEzaFlzekVZMwpSZkdpRkpQZHNOUG9CQVlEdXQrM3RRVzdIYS9RZ2EyaWpRdmxYRlJnazlTZWZDMHlsL1lLNFJYRW4yZzZVbnBGCkViRUhWSFdlWkpqYnNmZUJmUUpwMTJOM0RxQzNkMjNCUVNFSytnRlZubjE5YjlEdndTbUkreXNFenlRYi95bkIKVEFGdzJiUTdoQTEyUEgweGRMbG8wZUF1N0l0ZVU2MHMyb3pCVG1lMHAvLzFHY21XcDhvbk1KMlBqcUxYVGpiZApvV1Jua3oyc2o1RzBlSWpyamNKQ3dpQWpQZE1iS0JXRU9mZ3FMZjVkSk04V1FNVEs1Uno4NWFEQUFDTFNYYnpiCklRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K"
];

async function main() {
    const provider = new providers.JsonRpcProvider(process.env.ENDPOINT);
    const wallet = Wallet.fromMnemonic(process.env.MNEMONIC!!).connect(provider);

    const contract = StakeStar__factory.connect(addressesFor(chainId).stakeStar, wallet);

    const privateKey = signingKey(process.env.MNEMONIC_VALIDATORS!!, 0);

    const shares = await split(privateKey, operatorPubKeys);
    const data = generateDepositData(privateKey, contract.address, DEFAULT_GENESIS_FORK_VERSION);

    const coder = new AbiCoder();
    const params: StakeStar.ValidatorParamsStruct = {
        publicKey: data.depositData.pubkey,
        withdrawalCredentials: data.depositData.withdrawalCredentials,
        signature: data.depositData.signature,
        depositDataRoot: data.depositDataRoot,
        operatorIds: operatorIds,
        sharesPublicKeys: shares.map((share: any) => coder.encode([ "string" ], [ Buffer.from(share.publicKey).toString("base64") ])),
        sharesEncrypted: shares.map((share: any) => coder.encode([ "string" ], [ share.privateKey ]))
    }

    await contract.createValidator(params, BigNumber.from("1000000000000000000"));
}

main();