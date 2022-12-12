const express = require('express');
require('fs');
const router = express.Router();
const {Worker, parentPort} = require('worker_threads');
require("json-circular-stringify");
const worker_get = require.resolve('./worker-get.js');
const worker_put = require.resolve('./worker-put.js');
const {Wallets, X509Identity, GatewayOptions, Gateway} = require("fabric-network");

let gatewayOptions;
let contract;

router.get('/', function (req, res, next) {
    res.status(200).send("This is the ledger endpoint GET \n Endpoints: \n /chain/events \n POST /chain/publish");
});
/*
router.post('/pushdata', function (req, res, next) {
    let key = req.body.key;
    let data = req.body.data;
    console.log("key: " + key);
    console.log("data: " + data);
    fabconnection.invokeChaincode("pushData", [key, data], {}).then(queryChaincodeResponse => {
        res.status(200).send(queryChaincodeResponse.invokeResult);
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});

router.post('/pulldata/', function (req, res, next) {
    let query = req.body.query;
    console.log(query);
    //fabconnection.invokeChaincode('addservice', [JSON.stringify(servicedid), domain, JSON.stringify(predicates), status], {})
    fabconnection.queryChaincode('pullData', [query], {}).then(queryChaincodeResponse => {
        console.log('result: ' + queryChaincodeResponse)
        res.status(200).send(queryChaincodeResponse)//JSON.parse(queryChaincodeResponse.queryResult[0]));
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});
*/

// crea un hilo para pedir los historicos de un sensor
router.get('/events', async function (req, res, next) {
    console.log("getEvent: " + new Date(Date.now()).toISOString());

    const worker = new Worker(worker_get);
    start_worker(worker, res, req);




});

function start_worker(worker, res, req) {
    worker.on('message', (queryChaincodeResponseString) => {
        let queryChaincodeResponse = JSON.parse(queryChaincodeResponseString);
        console.debug("workerResponse: "+ typeof queryChaincodeResponse+ " -> " +queryChaincodeResponse);
        if (typeof queryChaincodeResponse !== 'undefined'){
            res.status(200).send(queryChaincodeResponse.queryResult)}
        else {
            res.status(500).send("posible error de TIMEOUT");
        }
    });
    worker.on('error', (error) => {
        console.log('FABRIC ERROR:-' + error);
        if (error.toString().includes('TIMEOUT')) { // Se ha producido un error de timeout

            res.status(500).send("ERROR TIMEOUT");
        } else {
            res.status(500).send("Unknown ERROR: " + error.message);
            console.error(error.message + "\n" + error.stack);
        }
    });
    worker.on('exit', (code) => {
        if (code !== 0)
            res.status(500).send("ERROR: Thread closed: code: "+code);
    });
    worker.postMessage(JSON.stringify(req));
}

router.post('/publish', async function (req, res, next) {
    console.log("publish: " + new Date(Date.now()).toISOString());

    const worker = new Worker(worker_put);
    start_worker(worker, res, req);
});

async function initGatewayOptions(config) {
    const wallet = await Wallets.newInMemoryWallet();
    const x509Identity = {
        credentials: {
            certificate: config.identity.certificate,
            privateKey: config.identity.privateKey,
        },
        mspId: config.identity.mspid,
        type: "X.509",
    };
    await wallet.put(config.identity.mspid, x509Identity);
    const gatewayOptions = {
        identity: config.identity.mspid,
        wallet,
        discovery: {
            enabled: config.settings.enableDiscovery,
            asLocalhost: config.settings.asLocalhost,
        },
    };
    return gatewayOptions;
}

async function initGateway(config) {
    try {
        //gatewayOptions
        const gateway = new Gateway();
        console.log("GATEWAYOPTIONS: " + gatewayOptions)
        const currentDate = new Date();
        const timestamp = currentDate.getTime();
        config.connectionProfile['name'] = 'umu.fabric.' + timestamp;
        config.connectionProfile['version'] = '1.0.0' + timestamp;
        await gateway.connect(config.connectionProfile, gatewayOptions);
        const network = await gateway.getNetwork(config.channelName);
        contract = network.getContract(config.contractName);
    } catch (error) {
        console.log("Hyperledger Error: " + error.toString())
        throw error;
    } finally {
    }
}
module.exports = router;
