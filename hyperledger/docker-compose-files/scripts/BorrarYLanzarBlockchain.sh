#!/bin/bash
echo "Deleting and Launching blockchain" 
set -x
sh borrarTodo.sh
sh borrarTodo.sh


docker-compose -f ../docker-compose-orderer-1.yml up
sleep 2

docker-compose -f ../docker-compose-ca-org1.yml up
docker-compose -f ../docker-compose-peer0-org1.yml up

sleep 5
docker-compose -f ../docker-compose-cli-peer0.yml up -d
docker exec -it cli bash -c "chmod +x ./scripts/crearCanal.sh; ./scripts/crearCanal.sh"

set +x


echo 'docker exec -it cli bash # para entrar en el CLI del nodo del blockchain
 sh scripts/installSC.sh PreceptSC 1 # para instalar el Smart Contract' 
