
import datetime
import requests
import json
import os
with open('block.txt', 'w') as txt_file:
    txt_file.write("Block number" + ',' + "Num tx" + ',' + "Date" + ',' + "Block Size" + ','+ '\n')
with open('perDay.txt', 'w') as file:
    file.write("Date" + ',' + "Num Blocks" + ',' + "Num Tx" + ',' + "Blk Size Count" + ',' + "Average tx per block" + ',' + "Average blksize per block" + '\n')
def get_date():
    return datetime.datetime.now().strftime("%a %b %d %Y %H:%M:%S GMT %z")
############################### LOGIN ###############################
url = "http://10.208.211.34:8080/auth/login"

payload = {
    "user":"bexplorer",
    "password":"bexplorerpw",
    "network":"test-network"
}
headers = {
  'Content-Type': 'application/json'
}
response = requests.request("POST", url, headers=headers, data = json.dumps(payload))

if response.json()['success'] == True:
    print(response.text.encode('utf8'))
    token = response.json()['token']
else:
    print("Error: " + response.text)

headers = {
    'Authorization': 'bearer ' + token
}
############################### GET CHANNEL GENESIS ID ###############################

url = "http://10.208.211.34:8080/api/curChannel"
response = requests.request("GET", url, headers=headers)

if response.status_code == 200:
    print(response.text.encode('utf8'))
    currentChannel = response.json()['currentChannel']
    print(currentChannel)
else:
    print("Error" + response.text)

############################### GET total number of each elements ###############################
url = "http://10.208.211.34:8080/api/status/" + currentChannel

response = requests.request("GET", url, headers=headers)

print(response.text)

dataelements = json.loads(response.text)

############################### GET ALL BLOCKS UNTIL TODAY ###############################
url = "http://10.208.211.34:8080/api/blockAndTxList/" + currentChannel + "/0?"
today = get_date()
fromparam = "from=Mon Jan 01 2022 00:00:00 GMT"
toparam = "&to="+today

response = requests.request("GET", url+fromparam+toparam, headers=headers)
if response.status_code == 200: 
    #print(response.text)


    data = json.loads(response.text)
    import json
    # divide dataelements txcount by dataelements latestBlock

    ld = -1
    lm=-1
    ly=-1
    sumblksize = 0
    daysum = 1
    sameday = False
    rows = data['rows']
    samedayDate = ""
    samedayBlocks = 0
    samedayTx = 0
    samedayBlkSize = 0
    
    print("comienza el bucle")
    for row in rows:
        
        channelname = row['channelname']
        blocknum = row['blocknum']
        txcount = row['txcount']
        datahash = row['datahash']
        blockhash = row['blockhash']
        prehash = row['prehash']
        createdt = row['createdt']
        blksize = row['blksize']
        txhash = row['txhash']
        date_object = datetime.datetime.strptime(createdt, "%Y-%m-%dT%H:%M:%S.%fZ")
    
        sameday = False
        if  ld != -1 and lm != -1 and ly != -1:
            if ly != date_object.year:
                daysum = daysum +1
            elif  lm != date_object.month:
                daysum = daysum +1
            elif ld  != date_object.day:
                daysum = daysum +1
            else:
                sameday = True
        else: 
            sameday = True

        samedayBlocks = samedayBlocks + 1
        samedayTx = samedayTx + txcount
        samedayBlkSize = samedayBlkSize + blksize
        if not sameday:
            #cambiamos de día -> guardamos en formato excel
            with open('perDay.txt', 'a') as file:
                file.write(samedayDate+ ',' + str(samedayBlocks) + ',' + str(samedayTx) + ',' + str(samedayBlkSize) + ',' + str(samedayTx//samedayBlocks) + ',' + str(samedayBlkSize//samedayBlocks) + '\n')
            samedayBlocks = 1
            samedayTx = txcount
            samedayBlkSize = blksize



        samedayDate= str(date_object.day)+'/'+str(date_object.month)+'/'+str(date_object.year)

        ld = date_object.day
        lm = date_object.month
        ly = date_object.year
        sumblksize = sumblksize + blksize
        with open('block.txt', 'a') as txt_file:
            txt_file.write(str(blocknum) + ',' + str(txcount) + ',' + createdt + ',' + str(blksize) + ','+ '\n')
    txaverageperblock = int(dataelements['txCount'])//int(dataelements['latestBlock'])
    averageblksize = sumblksize//int (dataelements['latestBlock'])
    averagetxperday = int(dataelements['txCount'])//daysum
    averageblkperday = int(dataelements['latestBlock'])//daysum
    
    print("average transactions per block: " + str(txaverageperblock))
    print("average block size : " + str(averageblksize))
    print("average transactions per day: " + str(averagetxperday))
    print("average block per day: " + str(averageblkperday))
    print("sum of block bytes: " + str(sumblksize))
else:
    print("Error" + response.text)









