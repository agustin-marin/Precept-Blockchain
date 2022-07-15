set -x

rm -rf ../../../crypto-config  ../../../channel-artifacts/
## Generar cryptografia
./cryptogen generate --config=../PeerOrgs1.yml --output="../../../crypto-config" # Generar ficheros criptograficos
./cryptogen generate --config=../orderer.yaml --output="../../../crypto-config" # Generar ficheros criptográficos

## Generar archivos de bloque
./configtxgen -profile  OneOrgOrdererGenesis  -outputBlock ../../../channel-artifacts/genesis.block -channelID orderer-system-channel -configPath "$PWD/../"  # generar fichero genesis usado por orderer
./configtxgen -outputCreateChannelTx ../../../channel-artifacts/mychannel.tx -profile OneOrgChannel -channelID mychannel -configPath "$PWD/../" # generar fichero .tx para crear el canal dentro del DLT

#./configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ../../../channel-artifacts/Org1MSPanchor.tx -channelID channel -asOrg Org1MSP -configPath "$PWD/../" # fichero (innecesario en este caso) para canales multiorganizaciones
