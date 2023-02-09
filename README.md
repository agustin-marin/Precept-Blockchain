# Precept-Blockchain

## Prerequisites
```

docker
docker-compose v1.28.+
curl
git
netcat
java -> default-jdk


curl -L https://github.com/docker/compose/releases/download/1.28.5/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

```

## Build/Deploy by yourself
```
git clone https://github.com/agustin-marin/Precept-Blockchain.git -b divided-roles
cd Precept-Blockchain/
git checkout   origin/divided-roles
bash setup.sh
#The command will ask the peer and orderer IP:
#  Generating crypto material...
#  Enter the IP of the machine is going to  hold the peer:
#  Enter the IP of the machine hold the orderer:
#Then the script will start to generating config files
```
After the script, you have 4 additional folders besides setup, the idea is that you can run every service standalone with only the folder, so you can move each folder to its corresponding machine. If you put your the same IP, you can run every service on the same machine. The IPs are for peer, orderer and CA certificates and to configure the ChainREST and the blockchain-explorer to point to that machines. So, you have to put the peer and orderer folders on the machines with the IPs you specified in the script.
### Deploy
To run each service:
#### Orderer
```
cd orderer/
cd docker-compose-files/
cd scripts/
bash runOrderer+.sh
```
This will delete previous deployments (delete the blockchain) and start the orderer and CA container.
#### Peer
```
cd peer/
cd docker-compose-files/scripts/
bash runPeer.sh
```
This will delete previous deployments (delete de blockchain) and start 4 containers: couchdb, peer, CLI, 1 smartcontract.
#### REST service

```
cd ChainREST/
cd scripts/
bash run.sh
```
This will run the nodejs REST service with 2 endpoints to publish and retreive events from IoT Devices.
#### Blockchain Explorer Service
```
cd blockchain-explorer/scripts/
bash run-blockchain-explorer.sh 
```
This will run the blockchain-explorer service to query transactions and blocks and get statistical data.
# Additional doc
On each folder you will find additional documentation.
