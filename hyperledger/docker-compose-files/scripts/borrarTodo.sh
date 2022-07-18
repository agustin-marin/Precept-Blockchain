#borrar todo

docker-compose -f ../docker-compose-ca-org1.yml down -v

docker-compose -f ../docker-compose-cli-peer0.yml down -v

docker-compose -f ../docker-compose-orderer-1.yml down -v

docker-compose -f ../docker-compose-peer0-org1.yml down -v

cd ../../../blockchain-explorer

docker-compose down -v

docker volume prune -f
