from datetime import datetime
import json
import requests
import subprocess

now = datetime.now()
current_date = now.strftime("%d/%m/%Y")

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

############################### GET size of docker volume ###############################
result = subprocess.check_output(["docker","system","df","-v"]).decode()
output = [x for x in result.split("\n") if "docker-compose-files_orderer.odins.com" in x][0]
output_list = output.split(" ")
last_value = output_list[-1]
print(last_value)
with open("results.txt", "a") as file:
        file.write(current_date + "," + last_value +","+json.loads(response.text)["txCount"]+"\n")