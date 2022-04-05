const {parentPort} = require('worker_threads');
const fs = require("fs");
const {Wallets, X509Identity, GatewayOptions, Gateway} = require("fabric-network");

const conf = {
    channelName: "mychannel",
    contractName: "PreceptSC",
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

parentPort.once('message', execution);

async function execution(reqString) {
    console.log("execution");

    let req = JSON.parse(reqString);

    let entity = req.query.entityid;
    //let from = "";
    //let to = "";

    /*if (typeof req.query.from !== 'undefined' && req.query.from) {
        from = req.query.from;
    }
    if (typeof req.query.to !== 'undefined' && req.query.to) {
        to = req.query.to;
    }*/

    let today = new Date(Date.now());
    let todaystring = today.toISOString();
    let remoteAddress = req.socket.remoteAddress;
    writeLOG(todaystring, remoteAddress, entity);
    gatewayOptions = await initGatewayOptions(conf);
    await initGateway(conf);
    queryChaincode("getEvent", [entity], {}).then(queryChaincodeResponse => {
        const {parentPort} = require('worker_threads');
        if (queryChaincodeResponse !== undefined && queryChaincodeResponse !== "undefined")
            parentPort.postMessage(JSON.stringify(queryChaincodeResponse));
    }).catch(error => {
    });
}

function writeLOG(todaystring, remoteAddress, entity) {
    fs.appendFile('/tmp/' + todaystring + '.LOG', remoteAddress + ': CHAINAPI:3000/getEvent?entityid=' + entity , function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

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

