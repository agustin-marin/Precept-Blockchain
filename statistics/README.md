# Statistical scripts
These two scripts are for recolecting statistical information about the blockchain in compatible excel format:
## makeStatisticsD.volume
This one tries to get the space on disk the container is using and save it for the actual day + number of transactions corresponding that size. The script gets the number of transactions by several HTTP request to the blockchain-explorer service and then gets the size of the docker volume the container is using at that moment
### result
The result is a file in compatible excel format with the following schema:
```
DATE,SIZE (GB), TX
23/01/2023,19.62GB,1704192

```

## makeStatistics
This one tries to get several data related to num of blocks, size of blocks, num of transactions and transactions per block for each day that has a block published(the blockchain was up and used). The scripts gets data from 01/01/2022 until today and calculate each day from all the data.
### result
The result is a file in compatible excel format with the following schema:
```
Date,Num Blocks,Num Tx,Blk Size Count,Average tx per block,Average blksize per block
1/2/2023,125,359,3818,2,30
26/1/2023,1578,4529,49867,2,31
25/1/2023,15633,44641,492041,2,31
24/1/2023,15558,44643,493721,2,31
```