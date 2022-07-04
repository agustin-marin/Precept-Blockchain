#!/bin/bash
echo "Lanzando blockchain" #crea multi pantallas con tmux con los diferentes contenedores y sus logs
set -x
tmux kill-session -t mysessionblockchain
sh borrarTodo.sh
sh borrarTodo.sh


tmux new  -s mysessionblockchain  -n 'orderer'  -d 'docker-compose -f ../docker-compose-orderer-1.yml up' \;
sleep 2

tmux split-window  -h -d 'docker-compose -f ../docker-compose-ca-org1.yml up' \;
tmux split-window  -v -d  'docker-compose -f ../docker-compose-peer0-org1.yml up' \;

sleep 5
docker-compose -f ../docker-compose-cli-peer0.yml up -d ; tmux select-pane -L ; sleep 5 ; tmux split-window -v 'docker exec -it cli bash -c "chmod +x ./scripts/crearCanal.sh; ./scripts/crearCanal.sh"'  \;
tmux select-pane -U
tmux a 

set +x
echo 'docker exec -it cli bash # para entrar en el CLI del nodo del blockchain
 sh scripts/installSC.sh PreceptSC 1 # para instalar el Smart Contract' 
