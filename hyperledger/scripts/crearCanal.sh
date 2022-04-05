#!/bin/bash
clear
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/odins.com/orderers/orderer.odins.com/msp/tlscacerts/tlsca.odins.com-cert.pem
peer channel create -o 10.208.211.22:7050 -c mychannel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/mychannel.tx --tls --cafile $ORDERER_CA
sleep 5
peer channel join -b ./mychannel.block --tls --cafile $ORDERER_CA
