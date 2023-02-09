# Blockchain explorer service
This is used to get blocks, transactions and statistics data from the blockchain.

# scripts
- run-blockchain-explorer: just make a docker-compose up -d
</p>
if you want to reset the content or fully restart the container/volume you need to:

```
docker stop explorerdb.mynetwork.com explorer.mynetwork.com
docker container prune -f # deletes all container stopped
docker volume prune -f # deletes all volumes not referenced by a container(running or paused)
```