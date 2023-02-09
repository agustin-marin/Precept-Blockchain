# Hyperledger folder
This folder has every file related to the blockchain build/deployment
In summary, it has the following structure:
```
$ ls -l
total 8
drwxrwxrwx 1 ab ab 4096 Dec 12 11:19 chaincode
drwxrwxrwx 1 ab ab 4096 Feb  2 16:07 channel-artifacts
drwxrwxrwx 1 ab ab 4096 Dec 12 11:19 crypto-config-source
drwxrwxrwx 1 ab ab 4096 Dec 16 17:26 docker-compose-files
-rwxrwxrwx 1 ab ab 5251 Feb  8 10:47 network.sh
-rwxrwxrwx 1 ab ab  148 Feb  9 15:17 README.md
```
## chaincode
This folder contains the smartcontract java-gradle project.
## channel-artifacts
this is a generated folder by a script which contains 2 genesis blocks generated using `crypto-config-source`:
-   `genesis.block`: the first block of the `orderer channel`
-   `mychannel.tx`: the first block of the channel `mychannel` 
<p>
This blocks are the first block which contains configuration and policies to be used between orderers and peers participating on respective channels. 

## crypto-config-source
contains the source code to generate config files, certificate files, and genesis blocks.
```
$ ls -l crypto-config-source/
-rwxrwxrwx 1 ab ab 4305 Dec 12 11:19 configtx.yaml
-rwxrwxrwx 1 ab ab  213 Dec 12 11:19 orderer.yaml 
-rwxrwxrwx 1 ab ab  284 Dec 12 12:22 PeerOrgs1.yml
drwxrwxrwx 1 ab ab 4096 Dec 12 11:19 scripts
```
- configtx.yaml # file defining the network structure, policies, initial number or organizations and number of channels and its configuration.
- orderer/peer*.yaml # files containing config data related to crypto material will be generated and used for TLS communication and authentication/wallets
- scripts #contains 2 commands and a script to generate de files and crypto material.
## docker-compose-files
contains docker-compose files that runs each component: CA, peer, CLI, couchdb, orderer
## network.sh
script to generate crypto material and config files. It also moves each file/folder to where its needed and change certificate/names on services if needed.
2 commands:
```
$ bash network.sh -crypto # run everything

$ bash network.sh -mvConfig # doesn't regenerate files, only moves and replace needed files with existing crypto and config files
```