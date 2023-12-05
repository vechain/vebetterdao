import { artifacts, contract, network } from "hardhat";
import { expect } from "chai";

const B3TRContract = artifacts.require('B3TR');

contract('B3TR Token', function (accounts) {
    beforeEach(async function () {
        this.B3TRContract = await B3TRContract.new({ from: accounts[0] });
    });

    it('max supply is set correctly', async function () {
        var res = await this.B3TRContract.maxSupply();
        expect(String(res)).to.eql('1000000000000000000000000000');
    });
});
