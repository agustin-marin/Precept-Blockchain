# Precept-Blockchain
## use hyperledger/network.sh to run the DLT
```
bash network.sh -h # show help message

bash network.sh -a # run everything automatically
# create crypto
# run containers in docker
# create channel
# compile and deploy smartcontract

bash network.sh -installSC
#after running the blockchain, recompile and redeploy(update) smartcontract, automatically.
```


# Services

- `Blockchain-explorer` exposes a dashboard to explore blocks and transactions confirmed in the ledger on `port 8080`. For example, You can go through tab blocks to get the list of saved blocks and by clicking on the transactions inside each block you can see the content of itself(read and write content to the ledger).
  - Credentials: bexplorer-bexplorerpw

- `ChainREST` endpoint has 2 routes exposed on `port 3000`
  - `IP:3000/chain/events`
    - method: GET
    - body: empty
    - params: [entityid]
    - example `http://IP:3000/chain/events?entityid=urn:ngsi-ld:IoTGateway:SMARTHOUSE-MONITORING-01`
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
    - example: `http://IP:3000/chain/publish` (body above)
