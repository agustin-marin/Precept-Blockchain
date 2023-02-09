# Jenkins pipelines for blockchain
This folder contains several files with the jenkins pipeline for 3 different tasks
## Task 1: Get REST service status "test-rest"
This pipeline tries to get and post the 2 endpoints defined on the REST nodejs service by using newman command and a postman collection exportation.
## Task 2: Run pythin script to get statistics of the blockchain "Precept statistics"
This pipeline tries to run a python script that gets statistics from the blockchain per day.
## Task 3: Run pythin script to get size of blockchain on disk "Precept size"
This pipeline tries to run a python script that gets disk usage of docker container at the moment it is executed.
