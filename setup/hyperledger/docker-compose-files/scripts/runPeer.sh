DEFAULT_PWD=$(pwd)

function installSC {
  echo "install smart contract"
  cd ../../chaincode/PreceptSC
  echo "compiling smart contract"
  ./gradlew installDist
    cp -r META-INF build/install/PreceptSC/
  cd build/install
  rm -r ../../../../docker-compose-files/chaincode/PreceptSC
  cp -r PreceptSC ../../../../docker-compose-files/chaincode/PreceptSC


  echo "running script to install smartcontract on peer container"
  #run script installSC on container named cli and redirect error to output
  output=$(docker exec -it cli sh scripts/installSC.sh PreceptSC 1 2>&1)
  echo $output
  # if output contains "but new definition must be sequence" then
  if [[ $output == *"but new definition must be sequence"* ]]; then
    echo "smart contract already installed, adding new version"
    # get number from substring
    number=$(echo $output | grep -o -E 'but new definition must be sequence [[:digit:]]+' | grep -o -E '[[:digit:]]+')
    docker exec -it cli bash scripts/installSC.sh PreceptSC $number 2>&1
    # but new definition must be sequence \d+
  fi
cd $DEFAULT_PWD
}

function deployPeer {

  echo " running script to deploy blockchain Peer"
  mkdir ../chaincode
  docker-compose -f ../docker-compose-cli-peer0.yml down -v 
  docker-compose -f ../docker-compose-peer0-org1.yml down -v
  docker-compose -f ../docker-compose-cli-peer0.yml down -v
  docker-compose -f ../docker-compose-peer0-org1.yml down -v


  docker-compose -f ../docker-compose-peer0-org1.yml up -d

  sleep 5
  docker-compose -f ../docker-compose-cli-peer0.yml up -d
  docker exec -it cli bash -c "chmod +x ./scripts/crearCanal.sh; ./scripts/crearCanal.sh"


  cd $DEFAULT_PWD
}

deployPeer
installSC

