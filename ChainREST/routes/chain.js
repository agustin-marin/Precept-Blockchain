const express = require('express');
require('fs');
const router = express.Router();
const {Worker, parentPort} = require('worker_threads');
require("json-circular-stringify");
const worker_get = require.resolve('./worker-get.js');
const worker_put = require.resolve('./worker-put.js');
const {default: fabricNetworkSimple} = require('fabric-network-simple');
const {Wallets, X509Identity, GatewayOptions, Gateway} = require("fabric-network");

const conf = fabricNetworkSimple.config = {
    channelName: "mychannel",
    contractName: "GuardianSC",
    connectionProfile: {
        name: "umu.fabric",
        version: "1.0.0",
        client: {
            organization: "Org1",
            connection: {
                timeout: {
                    peer: {
                        endorser: 3000
                    }
                }
            }
        },
        channels: {
            mychannel: {
                orderers: ["orderer.odins.com"],
                peers: {
                    "peer0.org1.odins.com": {
                        endorsingPeer: true,
                        chaincodeQuery: true,
                        ledgerQuery: true,
                        eventSource: true,
                        discover: true
                    }
                }
            },
        },
        organizations: {
            Org1: {
                mspid: "Org1MSP",
                peers: ["peer0.org1.odins.com"],
                certificateAuthorities: ["ca.org1.odins.com"]
            }
        },
        orderers: {
            "orderer.odins.com": {
                url: "grpcs://10.208.211.22:7050",
                tlsCACerts: {
                    path:
                        "/home/debian/ChainREST/test/ordererOrganizations/odins.com/orderers/orderer.odins.com/msp/tlscacerts/tlsca.odins.com-cert.pem",
                },
            }
        },
        peers: {
            "peer0.org1.odins.com": {
                "url": "grpcs://10.208.211.22:7051",
                tlsCACerts: {
                    path:
                        "/home/debian/ChainREST/test/peerOrganizations/org1.odins.com/peers/peer0.org1.odins.com/msp/tlscacerts/tlsca.org1.odins.com-cert.pem",
                },
            },
        },
    },
    certificateAuthorities: {
        "ca.org1.odins.com": {
            "url": "https://10.208.211.22:7054",
            "httpOptions": {
                "verify": false
            },
            "registrar": [{
                "enrollId": "admin",
                "enrollSecret": "adminpw"
            }]
        }
    },
    identity: {
        mspid: 'Org1MSP', // user
        certificate: '-----BEGIN CERTIFICATE-----\nMIICIzCCAcqgAwIBAgIQOiiS1yOEquA4L3f9PEuViDAKBggqhkjOPQQDAjBvMQsw\nCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy\nYW5jaXNjbzEXMBUGA1UEChMOb3JnMS5vZGlucy5jb20xGjAYBgNVBAMTEWNhLm9y\nZzEub2RpbnMuY29tMB4XDTIyMDIxNjEwNTQwMFoXDTMyMDIxNDEwNTQwMFowajEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xDzANBgNVBAsTBmNsaWVudDEdMBsGA1UEAwwUVXNlcjFAb3JnMS5v\nZGlucy5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARbB3Yqc98HYcuqOcoi\nm9vYK2S1uFUqGnOa2DWjJVdfQpWTflms9G+5zAiSauc6llqjZjfnR9njyzOf5f6V\n709Ro00wSzAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADArBgNVHSMEJDAi\ngCDZU9KRdaRULA+m1Icdnvk08XwL0Us+TYEhPv7/zckl7jAKBggqhkjOPQQDAgNH\nADBEAiAgvhVHaDS7qBnicVClnHpmCPXdhUiDGCoQ40793567zgIgF/H0vVvW5TWb\ntGMPzV3JBWc6VtiyjUPauQrnD+Tpe4c=\n-----END CERTIFICATE-----\n',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgM0xqTYqB3/dQ4rjN\npcQpJOrFluX5wxaEHpLe8zRKqjGhRANCAARbB3Yqc98HYcuqOcoim9vYK2S1uFUq\nGnOa2DWjJVdfQpWTflms9G+5zAiSauc6llqjZjfnR9njyzOf5f6V709R\n-----END PRIVATE KEY-----\n',
    },
    settings: {
        enableDiscovery: true,
        asLocalhost: false,
    }
};
let gatewayOptions;
let contract;

router.get('/', function (req, res, next) {
    res.status(200).send("This is the ledger endpoint GET \n Endpoints: \n gethistoricos?from=&to&entity&attribute");
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
router.get('/evento', async function (req, res, next) {
    console.log("getEvent: " + new Date(Date.now()).toISOString());

    const worker = new Worker(worker_get);
    start_worker(worker, res, req);




});

function start_worker(worker, res, req) {
    worker.on('message', (queryChaincodeResponseString) => {
        let queryChaincodeResponse = JSON.parse(queryChaincodeResponseString);
        if (typeof queryChaincodeResponse !== 'undefined')
            res.status(200).send(queryChaincodeResponse.queryResult);
        else {
            res.status(500).send("posible error de TIMEOUT");
        }
    });
    worker.on('error', (error) => {
        console.log('FABRIC ERROR:-' + error);
        if (error.toString().includes('TIMEOUT')) { // Se ha producido un error de timeout
            // RECREAR LA CONEXION?
            res.status(500).send("ERROR de TIMEOUT");
        } else {
            res.status(500).send("ERROR desconocido: " + error.message);
            console.error(error.message + "\n" + error.stack);
        }
    });
    worker.on('exit', (code) => {
        if (code !== 0)
            res.status(500).send("ERROR desconocido: El hilo se ha cerrado");
    });
    worker.postMessage(JSON.stringify(req));
}

router.post('/publicar', async function (req, res, next) {
    console.log("publicar: " + new Date(Date.now()).toISOString());

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
