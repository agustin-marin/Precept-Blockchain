# CHAINCODE / SMARTCONTRACT
This is the java projecto which contains the code of the smartcontract. To create a smartcontract for hyperledger fabric in JAVA we need the following requirements:

## build.gradle
```
plugins {
    id 'application'
}

application {
    mainClass = 'contracts.GuardianDataSaver'
}

maven {
    url "https://hyperledger.jfrog.io/hyperledger/fabric-maven"
}

dependencies {
    compileOnly 'org.hyperledger.fabric-chaincode-java:fabric-chaincode-shim:2.2.+'
    testImplementation 'org.hyperledger.fabric-chaincode-java:fabric-chaincode-shim:2.2.+'
}
```
- the plugin application: executed by the peer on the installation process. Must setup the mainclass for the plugin
- repository of hyperledger: for the dependencies
- dependencies of fabric chaincode
# Code
The main code of this smartcontract is on `setup\hyperledger\chaincode\PreceptSC\src\main\java\contracts\PreceptEventSaver.java`. Inside this file we must add:
```
@Contract(
        name = "",
        info = @Info(
                title = "Save and verify data from IoT sources",
                description = "",
                version = "1.0"
        )
)

@Default
public final class PreceptEventSaver implements ContractInterface {---}

@Transaction()
public String pullData(final Context ctx, final String query) {---}
```
- add @Contract label: used to complete metadata in the installation process inside the blockchain
- add @Default on the main class: indicating default class which has all the callable methods. Should implements ContractInterface
- add @Transaction() on each method you want to make callable by clients (example: ChainREST is a client). On each method you need at least the parameter Context ctx, which is used to get dynamic objects to interact with the ledger(database)

# Indexers for Couchdb
After building we need to add to the build folder the META-INF folder because we are using Couchdb, and we use indexers to get rich queries with better performance:
```
{
  "index":{
      "fields":[{"id": "desc" },{"timestamp.value": "desc"}]
  },

  "ddoc":"indexTimedlimitDoc",
  "name":"indexTimedlimit",
  "type":"json"
}

```
This indexer is sorting all data: by element id on each json added to the ledger and then by timestamp.

# Build and install
In the path `setup\hyperledger\docker-compose-files\scripts\installSC.sh` there is a script with the installation process inside de CLI container.
</p>

In the path `setup\hyperledger\docker-compose-files\scripts\runPeer.sh` there is a method inside the script called installSC which has all the steps to build and install a smartcontract in gradle-java to the blockchain
