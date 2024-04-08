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
const soloChainTag = 0xf6

// Setup the veworld-mock-config object
window['veworld-mock-config'] = {
    mnemonicWords : soloMnemonic,
    accountIndex: 0,
    controller: () => mockController,
    address: '',
    thorUrl: soloUrl,
    chainTag: soloChainTag,
    txId: '',
    certError: false,
    txError: false,
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
    },

    /**
     * Set the cert error flag
     */
    setCertError(error) {
        window['veworld-mock-config'].certError = error;
    },

    /**
     * Set the tx error flag
     */
    setTxError(error) {
        window['veworld-mock-config'].txError = error;
    }

}
/**
 * Sign and send a tx
 */
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
    window['veworld-mock-config'].address = senderAddress;
    console.log(`Sending tx from address: ${senderAddress}`);
    const latestBlock = await thorClient.blocks.getBestBlockCompressed()
    // add 50% padding to the gas estimate
    const gasResult = await thorClient.gas.estimateGas(clauses, senderAddress, {gasPadding: 0.5})
    const txGas = Math.ceil(gasResult.totalGas)
    // check if tx should fail
    const txError = window['veworld-mock-config'].txError
    if (txError === true) {
        console.log('Tx error flag set, tx will fail')
        txGas = 0
    }
    // tx body
    const txBody = {
        chainTag: window['veworld-mock-config'].chainTag,
        blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : '0x0',
        expiration: 18,
        clauses: clauses,
        gasPriceCoef: 0,
        gas: txGas,
        dependsOn: null,
        nonce: 0
    }
    // sign and send tx
    const rawNormalSigned = TransactionHandler.sign(txBody, privateKey).encoded
    const send = await thorClient.transactions.sendRawTransaction(`0x${rawNormalSigned.toString('hex')}`)
    const txId = send.id
    window['veworld-mock-config'].txId = txId
    return txId
}

/**
 * Sign a certificate
 */
const signCert = (msg) => {
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
    // check if cert should fail
    const certError = window['veworld-mock-config'].certError
    if (certError === true) {
        // change the purpose field to invalidate the cert against original
        console.log('Cert error flag set, cert will fail')
        cert.purpose = 'invalid'
    }

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
        return Promise.resolve(signCert(msg))
    },
};

