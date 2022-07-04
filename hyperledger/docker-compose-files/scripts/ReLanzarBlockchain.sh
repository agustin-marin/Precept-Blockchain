#/bin/bash
echo "ReLanzando blockchain"
sleep 1
tmux kill-session -t mysessionblockchain
tmux new  -s mysessionblockchain -n 'orderer'  -d 'docker-compose -f ../docker-compose-orderer-1.yml up' \;
tmux new-window -n 'CA' -d 'docker-compose -f ../docker-compose-ca-org1.yml up' \;
tmux new-window -n 'PEER0' -d  'docker-compose -f ../docker-compose-peer0-org1.yml up' \;
tmux new-window -n 'CLI + CHANNEL' -d 'docker-compose -f ../docker-compose-cli-peer0.yml up' \;
#tmux new-window -n 'BASH' -d 'docker exec -it docker-crypto_org1clipeer0_1 bash' \;
tmux a
