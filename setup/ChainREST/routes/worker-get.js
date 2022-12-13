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
                url: "grpcs://orderer.odins.com:7050",
                tlsCACerts: {
                    path:
                        "/usr/src/app/crypto-config/ordererOrganizations/odins.com/orderers/orderer.odins.com/msp/tlscacerts/tlsca.odins.com-cert.pem",
                },
            }
        },
        peers: {
            "peer0.org1.odins.com": {
                "url": "grpcs://peer0.org1.odins.com:7051",
                tlsCACerts: {
                    path:
                        "/usr/src/app/crypto-config/peerOrganizations/org1.odins.com/peers/peer0.org1.odins.com/msp/tlscacerts/tlsca.org1.odins.com-cert.pem",
                },
            },
        },
    },
    certificateAuthorities: {
        "ca.org1.odins.com": {
            "url": "https://ca.org1.odins.com:7054",
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
 certificate: '-----BEGIN CERTIFICATE-----\nMIICJDCCAcqgAwIBAgIQcoLV3IM8+T8NN/QOd+tWpDAKBggqhkjOPQQDAjBvMQsw\nCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy\nYW5jaXNjbzEXMBUGA1UEChMOb3JnMS5vZGlucy5jb20xGjAYBgNVBAMTEWNhLm9y\nZzEub2RpbnMuY29tMB4XDTIyMDcwNjEzMzQwMFoXDTMyMDcwMzEzMzQwMFowajEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xDzANBgNVBAsTBmNsaWVudDEdMBsGA1UEAwwUVXNlcjFAb3JnMS5v\nZGlucy5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASoB2lYTbtKa/d8pIG+\nDfTAVWaTudlGZRxI1lKEmrzbNY+/Iaad2j40ms7lM9/eIOGy+gRB3mRM11IlGVFm\nCY2+o00wSzAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADArBgNVHSMEJDAi\ngCC6ZIU4OsRGoDVPMYUhqHr+IwKVqndvBxj+DxKHntk5CTAKBggqhkjOPQQDAgNI\nADBFAiEA4yKyPMblL3O6OnPZKEDorWBZWS7uFXJwR6Jf5ZMuj7ACIALA6bqS6hCs\nptzq1f+FZ22K9mlggAg4t2WgwBvn+ehp\n-----END CERTIFICATE-----\n',

        privateKey: '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgGFhU/WpJYgSA4pfJ\nAfCsT98drV+6bpXbHXFoyqPx3kGhRANCAASoB2lYTbtKa/d8pIG+DfTAVWaTudlG\nZRxI1lKEmrzbNY+/Iaad2j40ms7lM9/eIOGy+gRB3mRM11IlGVFmCY2+\n-----END PRIVATE KEY-----\n',
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
        if (queryChaincodeResponse !== undefined && queryChaincodeResponse !== "undefined")
            console.debug("WORKER: " + typeof queryChaincodeResponse + "  ->  " + JSON.stringify(queryChaincodeResponse.toString()))
            parentPort.postMessage(queryChaincodeResponse.toString());
    }).catch(error => {
        console.error("fabconn.getEvent: " + error.toString())
        throw error;
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

