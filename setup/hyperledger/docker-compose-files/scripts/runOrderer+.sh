DEFAULT_PWD=$(pwd)


function deployNetwork {
  echo "deploy blockchain network"

  cd docker-compose-files/scripts
  echo " running script to deploy blockchain network"
  sh borrarTodo.sh
  sh borrarTodo.sh

  docker-compose -f ../docker-compose-orderer-1.yml up -d
  docker-compose -f ../docker-compose-ca-org1.yml up -d
  cd $DEFAULT_PWD
}

deployNetwork

