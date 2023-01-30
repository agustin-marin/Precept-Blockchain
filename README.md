# Precept-Blockchain
## use hyperledger/network.sh to run the DLT
```
bash network.sh -h
```

### start chain-REST and blockchain-explorer
- On `Precept-Blockchain/ChainREST/scripts` do 
```
bash generate-docker-image.sh
bash run-chain-REST.sh
```
- On `Precept-Blockchain/blockchain-explorer/scripts` do
```
bash run-blockchain-explorer.sh
```
Note: If the container gives an error it is possible that you may be trying to create the blockchain explorer container/volume, which try to create a wallet with always the same id by the ca.odins.com container. So, to avoid that error. delete ca.odins.com container and volume and redeploy
# Services

- `Blockchain-explorer` exposes a dashboard to explore blocks and transactions confirmed in the ledger on `port 8080`. For example, You can go through tab blocks to get the list of saved blocks and by clicking on the transactions inside each block you can see the content of itself(read and write content to the ledger).
  - Credentials: bexplorer-bexplorerpw

- `ChainREST` endpoint has 2 routes exposed on `port 3000`
  - `IP:3000/chain/events`
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
