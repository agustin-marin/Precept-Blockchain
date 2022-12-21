#!/bin/bash
clear
generate_crypto=false
install_SC=false
deploy_Network=false
run_ChainREST=false
run_Bexplorer=false
DEFAULT_PWD=$(pwd)
#function to print argument in colour pink

# function to print help
function printHelp {
  echo "Usage: ./network.sh [OPTION]..."
  echo "Run the network and chain-REST containers"
  echo "  -h: Prints help"
  echo "  -crypto: Generates crypto material"
  echo "Run every service on each service folder scripts"
  echo "../setup:"
  ls ../../
}


chmod -R 766 * #rwx rw rw
# test if crypto-config folder exists
if [ ! -d "crypto-config" ]; then
    generate_crypto=true
fi



# parse flags
while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -h )
    printHelp
    exit 0
    ;;
  -crypto )
    generate_crypto=true
    shift
    ;;
  * )
    errorln "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done




#function named generate crypto-config
function generateCryptoConfig {
    # delete crypto-config folder if it exists
    if [ -d "crypto-config" ]; then
        rm -rf crypto-config
    fi
    # ask for string input and save it in variable "ip"
    read -p "Enter the IP of the machine is going to  hold the peer: " ippeer
    read -p "Enter the IP of the machine hold the orderer: " iporderer

    replacepeer="s|- peer0\.org1\.odins\.com:.*|- peer0.org1.odins.com:$ippeer|g"
    replaceorderer="s|- orderer\.odins\.com:.*|- orderer.odins.com:$iporderer|g"
    replaceca="s|- ca\.org1\.odins\.com:.*|- ca.org1.odins.com:$iporderer|g"

    sed  -i -r "$replacepeer" ../blockchain-explorer/docker-compose.yaml
    sed  -i -r "$replacepeer" ../ChainREST/docker-compose-REST.yml
    sed  -i -r "$replaceca" ../blockchain-explorer/docker-compose.yaml
    sed  -i -r "$replaceca" ../ChainREST/docker-compose-REST.yml
    sed  -i -r "$replaceorderer" ../blockchain-explorer/docker-compose.yaml
    sed  -i -r "$replaceorderer" ../ChainREST/docker-compose-REST.yml

    sed  -i -r "$replacepeer" docker-compose-files/docker-compose-orderer-1.yml   
    sed  -i -r "$replaceorderer" docker-compose-files/docker-compose-peer0-org1.yml
    sed  -i -r "$replaceorderer" docker-compose-files/docker-compose-cli-peer0.yml

    cd crypto-config-source/scripts
    echo "1- generate crypto material and config files"
    echo "."
    echo "."
    echo "."
    bash generarFicherosTx.sh
    if [ "$?" -ne 0 ]; then
        echo "Failed to generate crypto material..."
        exit 1
    fi
    echo
    echo "Generate crypto material completed."

    cd $DEFAULT_PWD
    ls -l crypto-config 
    echo "2- put files on necessary directories"
    echo "copying crypto config and channel artifacts to docker folder"
    cp -r crypto-config channel-artifacts docker-compose-files/

    echo "copying crypto to ChainREST and blockchain explorer folders"
    cp -r crypto-config ../ChainREST
    cp -r crypto-config ../blockchain-explorer




# borrar ficheros que son del peer en orderer y viceversa

    rm -rf ../../orderer/docker-compose-files/scripts/runPeer.sh ../../orderer/docker-compose-files/scripts/crearCanal.sh ../../orderer/docker-compose-files/scripts/installSC.sh
    rm -rf ../../peer/docker-compose-files/scripts/runOrderer+.sh ../../peer/docker-compose-files/scripts/borrarTodo.sh
    rm -rf ../../orderer/docker-compose-files/docker-compose-peer0-org1.yml
    rm -rf ../../orderer/docker-compose-files/docker-compose-cli-peer0.yml
    rm -rf ../../peer/docker-compose-files/docker-compose-ca-org1.yml
    rm -rf ../../peer/docker-compose-files/docker-compose-orderer-1.yml

    rm -rf ../../orderer/docker-compose-files/chaincode


    echo "copying new user X.509 identity to ChainREST files"
    #replace line break of a file for a "\n" character in a new file
    certificate=$( sed  -z -e 's|\n|\\\\n|g' ./crypto-config/peerOrganizations/org1.odins.com/users/User1@org1.odins.com/msp/signcerts/User1@org1.odins.com-cert.pem)
    priv=$(sed  -z -e 's|\n|\\\\n|g' ./crypto-config/peerOrganizations/org1.odins.com/users/User1@org1.odins.com/msp/keystore/priv_sk)
    #replace whole line containning substring "x" with "newline"
    s1="s|certificate:.*///|certificate:\"$certificate\",///|g"
    s2="s|certificate:.*///|certificate:\"$certificate\",///|g"
    s3="s|privateKey:.*///|privateKey:\"$priv\",///|g"
    s4="s|privateKey:.*///|privateKey:\"$priv\",///|g"
    sed  -i -r "$s1" ../ChainREST/routes/worker-get.js
    sed  -i -r "$s2" ../ChainREST/routes/worker-put.js
    sed  -i -r "$s3" ../ChainREST/routes/worker-get.js
    sed  -i -r "$s4" ../ChainREST/routes/worker-put.js 


  echo "generating peer and orderer folder"
  
  rm -rf ../../orderer
  rm -rf ../../peer
  mkdir -p ../../orderer
  mkdir -p ../../peer
  echo "moving docker-compose files to peer and orderer folder"
 
  cp -r docker-compose-files/ ../../orderer
  cp -r docker-compose-files/ ../../peer
  cp -r chaincode ../../peer
  cp -r ../blockchain-explorer/ ../../ 
  cp -r ../ChainREST/ ../../ 
}


if [ "$generate_crypto" = true ]; then
    echo "Generating crypto material..."
    generateCryptoConfig
fi
