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
        certificate:"-----BEGIN CERTIFICATE-----\nMIICIzCCAcqgAwIBAgIQd6HqJkwZngE3FJIkWD549TAKBggqhkjOPQQDAjBvMQsw\nCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy\nYW5jaXNjbzEXMBUGA1UEChMOb3JnMS5vZGlucy5jb20xGjAYBgNVBAMTEWNhLm9y\nZzEub2RpbnMuY29tMB4XDTIyMTIxMjEzMzUwMFoXDTMyMTIwOTEzMzUwMFowajEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xDzANBgNVBAsTBmNsaWVudDEdMBsGA1UEAwwUVXNlcjFAb3JnMS5v\nZGlucy5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASfabsjk8LaHf0b/Gma\nQuh45PDzADV9VJb2vIqqbVsOfnlyH91P92v+C4jMv8lxfqt6WoGn5f4UX7qHYloO\n6HEno00wSzAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADArBgNVHSMEJDAi\ngCDoIkls8d6Lkm+CufwNlm49wzuMb/s+grEcmax7sdSbTjAKBggqhkjOPQQDAgNH\nADBEAiBFdN+NrBKvEZiQvT6F0lic5eYgDSSDgUip6uYeJg2UeAIgbqqHRkXfYxuA\nbMs97Oggd6tqXHpnH4da8hmGMXn+kIk=\n-----END CERTIFICATE-----\n",///
        privateKey:"-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgBcvseSrFLh1KGdP1\nY8TWgtVVcC0JuI6CrpcWBF0uOrahRANCAASfabsjk8LaHf0b/GmaQuh45PDzADV9\nVJb2vIqqbVsOfnlyH91P92v+C4jMv8lxfqt6WoGn5f4UX7qHYloO6HEn\n-----END PRIVATE KEY-----\n",///
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

    let body = req.body;
    let today = new Date(Date.now());
    let todaystring = today.toISOString();
    let remoteAddress = req.socket.remoteAddress;
    writeLOG(todaystring, remoteAddress);
    gatewayOptions = await initGatewayOptions(conf);
    await initGateway(conf);
    queryChaincode("publicarJson", [JSON.stringify(body)], {}).then(queryChaincodeResponse => {
        const {parentPort} = require('worker_threads');
        if (queryChaincodeResponse !== undefined && queryChaincodeResponse !== "undefined")
            parentPort.postMessage("{}"); // publicarJson es una funcion void
    }).catch(error => {
        console.error("fabconn.publicarJson: " + error.toString())
        throw error;
    });
}

function writeLOG(todaystring, remoteAddress, body) {
    fs.appendFile('/tmp/' + todaystring + '.LOG', remoteAddress + ': CHAINAPI:3000/publicarJson' , function (err) {
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

