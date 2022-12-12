#borrar todo

docker-compose -f ../docker-compose-ca-org1.yml down -v

docker-compose -f ../docker-compose-orderer-1.yml down -v

docker volume prune -f
