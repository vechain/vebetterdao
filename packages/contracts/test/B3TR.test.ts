import { ethers } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";
import { expect } from "chai";

describe("B3TR", function () {

    let cachedContractInstance: any = null;
    async function deploy(forceDeploy = false) {
        if (!forceDeploy && cachedContractInstance !== null) {
            return cachedContractInstance;
        }

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount, operatorAccount] = await ethers.getSigners();

        const B3TRContract = await ethers.getContractFactory("B3TR");
        const contractInstance = await B3TRContract.deploy(operatorAccount);

        const abiArray = B3TRContract.interface["fragments"];
        const abi = JSON.stringify(abiArray);

        cachedContractInstance = { contractInstance, owner, otherAccount, abi, operatorAccount };

        return cachedContractInstance;
    }

    describe("Access Control", function () {

        const thorSoloUrl = "http://127.0.0.1:8669";
        const config = {
            chainId: 1,
            from: undefined,
            gas: 10000,
            gasPrice: 10000,
            gasMultiplier: 1,
            url: thorSoloUrl,
            accounts: 'remote',
            timeout: 1000,
            httpHeaders: { ['test']: 'test' } as { [name: string]: string },
        } as unknown as HttpNetworkConfig;

        it('admin role is set correctly upon deploy', async function () {
            const { contractInstance, owner } = await deploy();

            const defaultAdminRole = await contractInstance.DEFAULT_ADMIN_ROLE()

            const res = await contractInstance.hasRole(defaultAdminRole, owner);
            expect(res).to.eql(true);
        })

        it('operator role is set correctly upon deploy', async function () {
            const { contractInstance, owner, otherAccount, operatorAccount } = await deploy();
            const operatorRole = await contractInstance.OPERATOR_ROLE()

            const res = await contractInstance.hasRole(operatorRole, operatorAccount);
            expect(res).to.eql(true);

            // test that operator role is not set for other accounts
            expect(await contractInstance.hasRole(operatorRole, otherAccount)).to.eql(false);
        })

        it('only admin can grant operator role', async function () {
            const { contractInstance, owner, otherAccount } = await deploy();

            const operatorRole = await contractInstance.OPERATOR_ROLE()

            expect(await contractInstance.hasRole(operatorRole, otherAccount)).to.eql(false);

            expect(contractInstance.connect(otherAccount).grantRole(operatorRole, otherAccount)).to.be.revertedWithoutReason

            await contractInstance.connect(owner).grantRole(operatorRole, otherAccount);
            expect(await contractInstance.hasRole(operatorRole, otherAccount)).to.eql(true);
        })

        it('only admin can revoke operator role', async function () {
            const { contractInstance, owner, otherAccount } = await deploy();

            const operatorRole = await contractInstance.OPERATOR_ROLE()

            await contractInstance.connect(owner).grantRole(operatorRole, otherAccount);
            expect(await contractInstance.hasRole(operatorRole, otherAccount)).to.eql(true);

            expect(contractInstance.connect(otherAccount).revokeRole(operatorRole, otherAccount)).to.be.revertedWithoutReason

            await contractInstance.connect(owner).revokeRole(operatorRole, otherAccount);
            expect(await contractInstance.hasRole(operatorRole, otherAccount)).to.eql(false);
        })

        it('only admin can grant admin role', async function () {
            const { contractInstance, owner, otherAccount } = await deploy();

            const adminRole = await contractInstance.DEFAULT_ADMIN_ROLE()

            // at the beginning owner is admin
            expect(await contractInstance.hasRole(adminRole, otherAccount)).to.eql(false);
            expect(await contractInstance.hasRole(adminRole, owner)).to.eql(true);

            expect(contractInstance.connect(otherAccount).grantRole(adminRole, otherAccount)).to.be.revertedWithoutReason

            await contractInstance.connect(owner).grantRole(adminRole, otherAccount);
            expect(await contractInstance.hasRole(adminRole, otherAccount)).to.eql(true);

            // owner is still admin until it is revoked
            expect(await contractInstance.hasRole(adminRole, owner)).to.eql(true);
        })


        it('only admin can revoke admin role', async function () {
            const { contractInstance, owner, otherAccount, operatorAccount } = await deploy();

            const adminRole = await contractInstance.DEFAULT_ADMIN_ROLE()

            // after last test both owner and otherAccount are admin
            expect(await contractInstance.hasRole(adminRole, otherAccount)).to.eql(true)
            expect(await contractInstance.hasRole(adminRole, owner)).to.eql(true);

            expect(contractInstance.connect(operatorAccount).revokeRole(adminRole, owner)).to.be.revertedWithoutReason

            await contractInstance.connect(otherAccount).revokeRole(adminRole, owner);

            // owner is no longer admin
            expect(await contractInstance.hasRole(adminRole, owner)).to.eql(false);

            // otherAccount is still admin until
            expect(await contractInstance.hasRole(adminRole, otherAccount)).to.eql(true);
        })
    });

    describe("Max supply", function () {
        it('max supply is set correctly', async function () {
            const { contractInstance } = await deploy(true);

            const res = await contractInstance.maxSupply();
            expect(String(res)).to.eql('1000000000000000000000000000');
        });

        it('only operator can mint', async function () {
            const { contractInstance, otherAccount, owner } = await deploy();

            expect(contractInstance.mint(otherAccount, ethers.parseEther('1'))).to.be.revertedWithoutReason
            const operatorRole = await contractInstance.OPERATOR_ROLE()

            await contractInstance.grantRole(operatorRole, owner);
            await expect(contractInstance.mint(otherAccount, ethers.parseEther('1'))).not.to.be.reverted

            const balance = await contractInstance.balanceOf(otherAccount);
            expect(String(balance)).to.eql(ethers.parseEther('1').toString());
        })

        it('cannot be minted more than max supply', async function () {
            const { contractInstance, otherAccount, owner } = await deploy();
            const operatorRole = await contractInstance.OPERATOR_ROLE()

            await contractInstance.grantRole(operatorRole, owner);
            await expect(contractInstance.mint(otherAccount, ethers.parseEther('1000000001'))).to.be.reverted
        })
    })

});