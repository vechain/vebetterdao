import { artifacts, contract, network } from "hardhat";
import { Contract, ContractFactory, BaseContract, ethers } from "ethers";
import { expect } from "chai";
import hre from "hardhat";


contract('B3TR Token', function (accounts) {
    let contractInstance = artifacts.require("B3TR");
    const deployer = accounts[0];
    const operator = accounts[1];

    before(async () => {
        const Contract = await hre.ethers.getContractFactory("B3TR")
        const contract = await Contract.deploy(operator);
        await contract.waitForDeployment()

        contractInstance = contract;
    });

    describe('Max supply', function () {
        it('max supply is set correctly', async function () {
            const res = await contractInstance.maxSupply();
            expect(String(res)).to.eql('1000000000000000000000000000');
        });

        // cannot be minted more than max supply
    })

    describe('Access Control', function () {
        it('admin role is set correctly upon deploy', async function () {
            const defaultAdminRole = await contractInstance.DEFAULT_ADMIN_ROLE()

            const res = await contractInstance.hasRole(defaultAdminRole, deployer);
            expect(res).to.eql(true);
        })

        it('operator role is set correctly upon deploy', async function () {
            const operatorRole = await contractInstance.OPERATOR_ROLE()

            const res = await contractInstance.hasRole(operatorRole, operator);
            expect(res).to.eql(true);

            // test that operator role is not set for other accounts
            expect(await contractInstance.hasRole(operatorRole, accounts[2])).to.eql(false);
        })


        // test that only admin can grant operator role
        it('only admin can grant operator role', async function () {
            const operatorRole = await contractInstance.OPERATOR_ROLE()
            const defaultAdminRole = await contractInstance.DEFAULT_ADMIN_ROLE()

            await contractInstance.connect(accounts[2]).grantRole(operatorRole, accounts[2])

            await contractInstance.grantRole(operatorRole, accounts[2]);
            expect(await contractInstance.hasRole(operatorRole, accounts[2])).to.eql(true);
            expect(await contractInstance.hasRole(operatorRole, accounts[1])).to.eql(false);
        })

        // test that only admin can revoke operator role


        // test that only admin can grant admin role


        // test that only admin can revoke admin role

    })
});
