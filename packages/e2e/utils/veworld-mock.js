import {
    certificate,
    secp256k1,
    blake2b256,
    TransactionHandler,
    HDNode
} from '@vechain/sdk-core';
import { HttpClient, ThorClient } from '@vechain/sdk-network';

// default solo settings
const soloMnemonic = 'denial kitchen pet squirrel other broom bar gas better priority spoil cross'.split(' ');
const soloUrl = "https://localhost:8669"
const soloAddress = "0xf077b491b355e64048ce21e3a6fc4751eeea77fa"
const soloChainTag = 0xf6

// Setup the veworld-mock-config object
window['veworld-mock-config'] = {
    mnemonicWords : soloMnemonic,
    accountIndex: 0,
    controller: () => mockController,
    address: soloAddress,
    thorUrl: soloUrl,
    chainTag: soloChainTag,
    txId: ''
}
console.log('veworld-mock-config: controller installed');


const mockController = {

    /**
     * Install the veworld mock on to the window object
     */
    installMock() {
        window['vechain'] = {
            isVeWorld: true,
            newConnexSigner: () => mockedConnexSigner
          }
    },
    
    /**
     * Uninstall the veworld mock from the window object
     */
    uninstallMock() {
        delete window['vechain'];
    },

    /**
     * Set the cert & tx signer mnemonic words
     */
    setMnemonic(mnemonicWords) {
        window['veworld-mock-config'].mnemonicWords = mnemonicWords;
    },

    /**
     * Set the cert & tx signer account index
     */
    setAccIndex(index) {
        window['veworld-mock-config'].accountIndex = index;
    },

    getAccAddress() {
        return window['veworld-mock-config'].address;
    },

    /**
     * Set the thor url
     */
    setThorUrl(url) {
        window['veworld-mock-config'].thorUrl = url;
    },

    /**
     * Set the chain tag for the mock
     */
    setChainTag(chainTag) {
        window['veworld-mock-config'].chainTag = chainTag;
    },

    /**
     * Get the last signed tx id
     */
    getTxId() {
        return window['veworld-mock-config'].txId;
    }

}

const signAndSendTx = async (txMessage, txOptions) => {
    // build tx object - ignore tx options for now
    const httpClient = new HttpClient(window['veworld-mock-config'].thorUrl)
    const thorClient = new ThorClient(httpClient)
    const clauses = txMessage.map(clause => ({
        to: clause.to,
        value: clause.value,
        data: clause.data || '0x',
    }))
    const hdNode = HDNode.fromMnemonic(window['veworld-mock-config'].mnemonicWords);
    const childNode = hdNode.derive(window['veworld-mock-config'].accountIndex);
    const privateKey = childNode.privateKey;
    const senderAddress = childNode.address;
    const latestBlock = await thorClient.blocks.getBestBlockCompressed()
    // add 50% padding to the gas estimate
    const gasResult = await thorClient.gas.estimateGas(clauses, senderAddress, {gasPadding: 0.5})
    const txBody = {
        chainTag: window['veworld-mock-config'].chainTag,
        blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : '0x0',
        expiration: 18,
        clauses: clauses,
        gasPriceCoef: 0,
        gas: Math.ceil(gasResult.totalGas),
        dependsOn: null,
        nonce: 0
    }
    const rawNormalSigned = TransactionHandler.sign(txBody, privateKey).encoded
    const send = await thorClient.transactions.sendRawTransaction(`0x${rawNormalSigned.toString('hex')}`)
    const txId = send.id
    window['veworld-mock-config'].txId = txId
    return txId
}

/**
 * Mock of ConnexSigner
 */
const mockedConnexSigner = {
    async signTx(txMessage, txOptions) {
        console.log('VeWorld Mock - Signing tx')
        const txId = await signAndSendTx(txMessage, txOptions)
        console.log(`VeWorld Mock - Tx signed with id: ${txId}`)
        return Promise.resolve({
            txid: txId,
            signer: window['veworld-mock-config'].address
        })

    },

    signCert(msg) {
        const hdNode = HDNode.fromMnemonic(window['veworld-mock-config'].mnemonicWords);
        const childNode = hdNode.derive(window['veworld-mock-config'].accountIndex);
        const privateKey = childNode.privateKey;
        const address = childNode.address;
        window['veworld-mock-config'].address = address;
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

