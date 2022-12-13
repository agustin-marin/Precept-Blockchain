# Precept-Blockchain

## Prerequisites
```

docker
docker-compose v1.28.+
curl
git
netcat
java -> default-jdk


curl -L https://github.com/docker/compose/releases/download/1.28.5/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

```

## Generate grypto and services folder
Inside `setup/hyperledger/` run `bash network.sh -crypto`. It generates folders for each service:
```
drwxr-xr-x 5 debian debian 4096 Dec 12 15:59 blockchain-explorer
drwxr-xr-x 9 debian debian 4096 Dec 12 15:59 ChainREST
drwxr-xr-x 3 debian debian 4096 Dec 12 15:59 orderer
drwxr-xr-x 4 debian debian 4096 Dec 12 15:59 peer
-rw-r--r-- 1 debian debian  293 Dec 12 16:45 README.md
-rw-r--r-- 1 debian debian  168 Dec 12 16:44 sendFolder.txt
drwxr-xr-x 5 debian debian 4096 Dec 12 15:58 setup

```
## Run each service
Inside the folder `script` on each service there is a script called RunXXX.sh or run.sh or similar to run the service.
