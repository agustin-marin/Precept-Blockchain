# Precept-Blockchain
## steps to set up and deploy blockchain
1. modify/generate crypto material and config files (do once)
2. put files on necessary directories (do once)
3. deploy blockchain network
4. install smart contract
5. start chain-REST and blockchain-explorer

### 1. modify/generate crypto material and config files
On `Precept-Blockchain/blockchain-explorer/docker-compose.yaml` AND `Precept-Blockchain/ChainREST/docker-compose-REST.yaml` change IP to host machine IP (not 127......)
```
      - peer0.org1.odins.com:127.0.0.1
      - orderer.odins.com:127.0.0.1
      - ca.org1.odins.com:127.0.0.1
```
To have connectivity between containers from REST and blockchain-explorer to the DLT/blockchain network.
</p>

To generate crypto material and config files on `Precept-Blockchain/hyperledger/crypto-config-source/scripts` do:

``` 
bash generarFicherosTx.sh
```


### 2. put files on necessary directories (do once)
 
It will generate files in `../crypto-config` and `../channel-artifacts` (see script). Copy theese folders to `Precept-Blockchain/hyperledger/docker-compose-files/`. (crypto material and config files used by docker containers.)

After generating files, on `Precept-Blockchain/ChainREST/routes/worker-get.js` and `Precept-Blockchain/ChainREST/routes/worker-put.js` change: 
```
    identity: {
        mspid: 'Org1MSP', // user
        certificate: 'THIS to Precept-Blockchain/hyperledger/docker-compose-files/crypto-config/peerOrganizations/org1.odins.com/users/User1@org1.odins.com/msp/signcerts/User1@org1.odins.com-cert.pem file content',
        privateKey: 'THIS to Precept-Blockchain/hyperledger/docker-compose-files/crypto-config/peerOrganizations/org1.odins.com/users/User1@org1.odins.com/msp/heystore/priv_sk file content',
    },
```

Copy crypto-config folder  generated to `Precept-Blockchain/ChainREST/`)

### 3. deploy blockchain network 
inside this folder `Precept-Blockchain/hyperledger/docker-compose-files/scripts` there are some scripts to deploy/destroy/etc the blockchain
- Do the following to run the blockchain empty.
```
bash BorrarYLanzarBlockchain.sh
```

- Do the following to redeploy containers without deleting the DLT
```
bash ReLanzarBlockchain.sh
``` 
- if everything went OK, you have the blockchain deployed with a channel created

### 4. install smart contract
The smart contract source code is on `Precept-Blockchain/hyperledger/chaincode/PreceptSC` (gradle project).
</p>
To install it on the blockchain, first, we have to build the gradle project on that folder with(every time a change on the SC is done):

```
./gradlew installDist
```

It will generate a folder in `Precept-Blockchain/hyperledger/chaincode/PreceptSC/build/install` called `PreceptSC` with the builded project. Copy this folder to `Precept-Blockchain/hyperledger/docker-compose-files/chaincode` so it is accesible by containers.

Then, after deploying the blockchain network you can run:
```
docker exec -it cli bash # para entrar en el CLI del nodo del blockchain

 sh scripts/installSC.sh PreceptSC 1 # para instalar el Smart Contract
```
the script waits  name + version

</p>

NOTE: on each install/update is needed to increment the version number. If you don't remember the last one you can check the history on the CLI or just run it on version 1 and it should show an error telling that it expect sequence number X. That is your next version number.

</p>

Now, the Smart Contract is installed.

### 5. start chain-REST and blockchain-explorer
- On `Precept-Blockchain/ChainREST/scripts` do 
```
bash generate-docker-image.sh
bash run-chain-REST.sh
```
- On `Precept-Blockchain/blockchain-explorer/scripts` do
```
bash run-blockchain-explorer.sh
```

# Services

- `Blockchain-explorer` exposes a dashboard to explore blocks and transactions confirmed in the ledger on `port 8080`. For example, You can go through tab blocks to get the list of saved blocks and by clicking on the transactions inside each block you can see the content of itself(read and write content to the ledger).

- `ChainREST` endpoint has 2 routes exposed on `port 3000`
  - `IP:3000/chain/event`
    - method: GET
    - body: empty
    - params: [entityid]
    - example `http://155.54.95.201:3000/chain/event?entityid=urn:ngsi-ld:IoTGateway:SMARTHOUSE-MONITORING-01`
  - `IP:3000/chain/publish`
    - method: POST
    - body:JSON to publish (example)
    ```
    {
    "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "id": "urn:ngsi-ld:IoTGateway:SMARTHOUSE-MONITORING-01",
    "type": "IoTGateway",
    "CO2": {
    "value": "71.3",
    "type": "Property"
    },
    "Consumption_Energy": {
    "value": "2300.3",
    "type": "Property"
    },
    "Humidity": {
    "value": "23.1",
    "type": "Property"
    },
    "Photovoltaic_Energy": {
    "value": "1577.3",
    "type": "Property"
    },
    "Temperature": {
    "value": "40.3",
    "type": "Property"
    },
    "Ventilator": {
    "value": "On",
    "type": "Property"
    },
    "timestamp": {
    "value": "2022-01-28 09:10:03",
    "type": "Property"
    }
    }
    ```
    - example: `http://155.54.95.201:3000/chain/publish` (body above)

- `Remote server`: A remote server with the described services is on `155.54.95.201`
