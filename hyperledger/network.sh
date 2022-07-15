#!/bin/bash
clear
generate_crypto=false
install_SC=false
deploy_Network=false
run_ChainREST=false
run_Bexplorer=false
DEFAULT_PWD=$(pwd)
#function to print argument in colour pink
function printPink {
  echo -e "\e[35m$1\e[0m"
}

# function to print help
function printHelp {
  printPink "Usage: ./network.sh [OPTION]..."
  printPink "Run the network and chain-REST containers"
  printPink "  -h: Prints help"
  printPink "  -crypto: Generates crypto material"
  printPink "  -installSC: Compiles and installs the Smart Contract(PRECECTSC)"
  printPink "  -deploy: Deploys the network (to delete existing network run -crypto and the script will understand you want to delete everything and start from zero)"
  printPink "  -rest:    run the chain-REST container"
  printPink "  -explorer:     run the bexplorer container"
  printPink "  -a: (all): Runs | deploys everything"
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
  -installSC )
    install_SC=true
    shift
    ;;
  -crypto )
    generate_crypto=true
    shift
    ;;
    -deploy )
    deploy_Network=true
    shift
    ;;
    -a ) # all
    generate_crypto=true
    deploy_Network=true
    install_SC=true
    run_ChainREST=true
    run_Bexplorer=true
    shift
    ;;
    -rest )
    run_ChainREST=true
    shift
    ;;
    -explorer )
    run_Bexplorer=true
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
    cd crypto-config-source/scripts
    printPink "1- generate crypto material and config files"
    echo "."
    echo "."
    echo "."
    bash generarFicherosTx.sh
    if [ "$?" -ne 0 ]; then
        printPink "Failed to generate crypto material..."
        exit 1
    fi
    echo
    printPink "Generate crypto material completed."

    cd $DEFAULT_PWD
    ls -l crypto-config 
    printPink "2- put files on necessary directories"
    printPink "copying crypto config and channel artifacts to docker folder"
    cp -r crypto-config channel-artifacts docker-compose-files/

    printPink "copying crypto to ChainREST and blockchain explorer folders"
    cp -r crypto-config ../ChainREST
    cp -r crypto-config ../blockchain-explorer

    printPink "copying new user X.509 identity to ChainREST files"
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

    printPink "Did it work?"
    printPink " certificate from crypto-config:  $certificate"

    printPink " grep certificate from ChainREST/routes/worker-get.js: " $(grep  CERTIFICATE ../ChainREST/routes/worker-get.js)

        printPink " private key from crypto-config:  $priv"
    printPink " grep private key from ChainREST/routes/worker-get.js: " $(grep PRIVATE ../ChainREST/routes/worker-get.js)
    #bash redirect error output to /dev/null

  cd $DEFAULT_PWD
}

# function to deploy hyperledger fabric blockchain network
function deployNetwork {
  printPink "3- deploy blockchain network"
  #test if crypto-config folder exists, if not, run generateCryptoConfig function
  if [ ! -d "crypto-config" ]; then
      generateCryptoConfig
  fi

  cd docker-compose-files/scripts
  printPink " running script to deploy blockchain network"
  mkdir ../chaincode
  if [ "$generate_crypto" = true ]; then
    printPink "-crypto flag was set, so we will delete everything and start from scratch"
    bash BorrarYLanzarBlockchain.sh
  else
    bash ReLanzarBlockchain.sh
  fi


  cd $DEFAULT_PWD
}

function installSC {
  printPink "4- install smart contract"
  cd chaincode/PreceptSC
  printPink "compiling smart contract"
  ./gradlew installDist
  cd build/install
  cp -r META-INF build/install/PreceptSC/
  rm -r ../../../../docker-compose-files/chaincode/PreceptSC
  cp -r PreceptSC ../../../../docker-compose-files/chaincode/PreceptSC


  printPink "running script to install smartcontract on peer container"
  #run script installSC on container named cli and redirect error to output
  output=$(docker exec -it cli sh scripts/installSC.sh PreceptSC 1 2>&1)
  printPink $output
  # if output contains "but new definition must be sequence" then
  if [[ $output == *"but new definition must be sequence"* ]]; then
    printPink "smart contract already installed, adding new version"
    # get number from substring
    number=$(echo $output | grep -o -E 'but new definition must be sequence [[:digit:]]+' | grep -o -E '[[:digit:]]+')
    docker exec -it cli bash scripts/installSC.sh PreceptSC $number 2>&1
    # but new definition must be sequence \d+
  fi


}
if [ "$generate_crypto" = true ]; then
    echo "Generating crypto material..."
    generateCryptoConfig
fi

if [ "$deploy_Network" = true ]; then
    echo "Deploying network..."
    deployNetwork
fi

if [ "$install_SC" = true ]; then
    printPink "Installing smart contract..."
    installSC
fi
if [ "$run_ChainREST" = true ]; then
    cd $DEFAULT_PWD
    cd ../ChainREST/scripts
    printPink "Running ChainREST..."
    printPink "Generating docker image for ChainREST"
    bash generate-docker-image.sh
    printPink "Running docker compose"
    bash run-chain-REST.sh
fi

if [ "$run_ChainREST" = true ]; then
    cd $DEFAULT_PWD
    cd ../blockchain-explorer/scripts
    printPink "Dashboard..."
    printPink "running docker compose"
    bash run-blockchain-explorer.sh

fi

