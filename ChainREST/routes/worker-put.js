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
                        "/usr/src/app/crypto-config/ordererOrganizations/odins.com/orderers/orderer.odins.com/msp/tlscacerts/tlsca.odins.com-cert.pem",
                },
            }
        },
        peers: {
            "peer0.org1.odins.com": {
                "url": "grpcs://10.208.211.22:7051",
                tlsCACerts: {
                    path:
                        "/usr/src/app/crypto-config/peerOrganizations/org1.odins.com/peers/peer0.org1.odins.com/msp/tlscacerts/tlsca.org1.odins.com-cert.pem",
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
        certificate: '-----BEGIN CERTIFICATE-----\nMIICJTCCAcugAwIBAgIRAIBJpkfyAzcxgGKl/TairpwwCgYIKoZIzj0EAwIwbzEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xFzAVBgNVBAoTDm9yZzEub2RpbnMuY29tMRowGAYDVQQDExFjYS5v\ncmcxLm9kaW5zLmNvbTAeFw0yMjAzMTAxNTA3MDBaFw0zMjAzMDcxNTA3MDBaMGox\nCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQHEw1TYW4g\nRnJhbmNpc2NvMQ8wDQYDVQQLEwZjbGllbnQxHTAbBgNVBAMMFFVzZXIxQG9yZzEu\nb2RpbnMuY29tMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4RoBXWCxSqWDckNp\numi2pLdPnQtvYSTFdq+ADSvmzwtypgBsNqCNaDkXP9e+bufxTzfGiORtHOdlBTCK\nfvuiUaNNMEswDgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAwKwYDVR0jBCQw\nIoAgGvIstgBw6hwsTtuSy2DRUUIcNZql7XD/OaDKLOueZD8wCgYIKoZIzj0EAwID\nSAAwRQIhAJonQph0Y9Cw56mMxkDuRc5zI4sVSR2Fv99ws2QESdOLAiBkbhLrZaN8\nA3zOlZ8fXD9WaeJqZJ7zLilS5rBD2UQrKg==\n-----END CERTIFICATE-----\n',///
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg4rZbRYQIXYXHO02X\nQRBxHwH+cQrGZQw18zk3w02bxRKhRANCAAThGgFdYLFKpYNyQ2m6aLakt0+dC29h\nJMV2r4ANK+bPC3KmAGw2oI1oORc/175u5/FPN8aI5G0c52UFMIp++6JR\n-----END PRIVATE KEY-----\n',///
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

