#/bin/bash
echo "ReLaunching blockchain"
sleep 1
docker-compose -f ../docker-compose-orderer-1.yml up -d
docker-compose -f ../docker-compose-ca-org1.yml up -d
docker-compose -f ../docker-compose-peer0-org1.yml up -d
docker-compose -f ../docker-compose-cli-peer0.yml up -d

