const {parentPort} = require('worker_threads');



const {initGateway, conf} = require('./common');

let contract;

parentPort.once('message', execution);

async function execution(reqString) {
    console.log("execution");

    let req = JSON.parse(reqString);

    let entity = req.query.entityid;

    contract = await initGateway(conf);
    queryChaincode("getEvent", [entity], {}).then(queryChaincodeResponse => {
        if (queryChaincodeResponse !== undefined && queryChaincodeResponse !== "undefined")
            console.debug("WORKER: " + typeof queryChaincodeResponse + "  ->  " + JSON.stringify(queryChaincodeResponse.toString()))
            parentPort.postMessage(queryChaincodeResponse.toString());
    }).catch(error => {
        console.error("fabconn.getEvent: " + error.toString())
        throw error;
    });
}


async function queryChaincode(transaction, args) {
    try {
        const queryResult = contract.evaluateTransaction(
            transaction,
            ...args
        );
        let result = "[]";
        if (queryResult) {
            result = queryResult.toString();
        }
        return queryResult;
    } catch (error) {
        console.error('Failed to query transaction: "${transaction}"' +
            ' with arguments: "${args}", error: "${error}"' + error.toString());
    }
}

