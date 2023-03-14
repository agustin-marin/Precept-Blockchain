const express = require('express');
require('fs');
const router = express.Router();
const {Worker, parentPort} = require('worker_threads');
require("json-circular-stringify");
const worker_get = require.resolve('./worker-get.js');
const worker_put = require.resolve('./worker-put.js');

router.get('/', function (req, res, next) {
    res.status(200).send("This is the ledger endpoint GET \n Endpoints: \n /chain/events \n POST /chain/publish");
});

// crea un hilo para pedir los historicos de un sensor
router.get('/events', async function (req, res, next) {
    console.log("getEvent: " + new Date(Date.now()).toISOString());

    const worker = new Worker(worker_get);
    start_worker(worker, res, req);




});

function start_worker(worker, res, req) {
    worker.on('message', (queryChaincodeResponseString) => {
        let queryChaincodeResponse = JSON.parse(queryChaincodeResponseString);
        console.debug("worker "+worker.threadId+ ": "+ typeof queryChaincodeResponse+ " -> " +queryChaincodeResponse);
        if (typeof queryChaincodeResponse !== 'undefined'){
            res.status(200).send(queryChaincodeResponse.queryResult)}
        else {
            res.status(500).send("posible error de TIMEOUT");
        }
        res.end();
        worker.terminate()
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

module.exports = router;
