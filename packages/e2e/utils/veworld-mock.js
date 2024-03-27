import {
    certificate,
    secp256k1,
    blake2b256,
} from '@vechain/sdk-core';
import { HDNode } from '@vechain/sdk-core';

const soloMnemonic = 'denial kitchen pet squirrel other broom bar gas better priority spoil cross'.split(' ');
const soloUrl = "https://localhost:8669"

window['veworld-mock'] = {
    mnemonicWords : soloMnemonic,
    accountIndex: 0,
    controller: () => mockController,
    address: "0xf077b491b355e64048ce21e3a6fc4751eeea77fa",
    thorUrl: soloUrl
}
console.log('veworld-mock: controller installed');


const mockController = {
    installMock() {
        window['vechain'] = {
            isVeWorld: true,
            newConnexSigner: () => mockedConnexSigner
          }
    },
    
    uninstallMock() {
        delete window['vechain'];
    },

    setMockSignerMnemonic(mnemonicWords) {
        window['veworld-mock'].mnemonicWords = mnemonicWords;
    },

    setMockSignerAccIndex(index) {
        window['veworld-mock'].accountIndex = index;
    },

    setMockThorUrl(url) {
        window['veworld-mock'].thorUrl = url;
    }

}

const mockedConnexSigner = {
    signTx() {
        return Promise.resolve({ txid: '0x1234', signer: address });
    },

    signCert(msg) {
        const hdNode = HDNode.fromMnemonic(window['veworld-mock'].mnemonicWords);
        const childNode = hdNode.derive(window['veworld-mock'].accountIndex);
        const privateKey = childNode.privateKey;
        const address = childNode.address;
        window['veworld-mock'].address = address;
        console.log(`Singing certificate with address: ${address}`);
        const cert = {
            domain: ' localhost:3000',
            timestamp: 12341234,
            signer: address,
            payload: msg.payload,
            purpose: msg.purpose,
        };

        const signature = secp256k1.sign(
            blake2b256(certificate.encode(cert)),
            privateKey,
        );

        const response = {
            annex: {
                domain: cert.domain,
                timestamp: cert.timestamp,
                signer: cert.signer,
            },
            signature: `0x${signature.toString('hex')}`,
        }
        console.log('Signed certificate:', response);
        return response;
    },
};