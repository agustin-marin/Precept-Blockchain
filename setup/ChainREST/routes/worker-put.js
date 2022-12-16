const {parentPort} = require('worker_threads');

const {initGateway, conf} = require('./common');

let contract;

parentPort.once('message', execution);


async function execution(reqString) {
    console.log("execution");

    let req = JSON.parse(reqString);

    let body = req.body;

    contract = await initGateway(conf);
    queryChaincode("publicarJson", [JSON.stringify(body)], {}).then(queryChaincodeResponse => {
        const {parentPort} = require('worker_threads');
        if (queryChaincodeResponse !== undefined && queryChaincodeResponse !== "undefined")
            parentPort.postMessage("{}"); // publicarJson es una funcion void
    }).catch(error => {
        console.error("fabconn.publicarJson: " + error.toString())
        throw error;
    });
}

async function queryChaincode(transaction, args) {
    try {
        const queryResult = contract.submitTransaction(
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
