# Dynatrace-Config-Manager

### BETA VERSION

##### Disclaimer:

* I made my code available to everyone, but this project is not stable for now.
* It is not officially supported in any way by Dynatrace or myself.
* Use at your own risks.

### Vision:
I am working towards a "one click migration" for complete tenant configurations to another tenant.
I also dream of moving the agents themselves (oneagentctl --set-tenant ...), but other people are tackling this problem.

### Access Tokens
It is required that you use an access token with these scopes:
* Minimal: Read entities & Read settings
* Target Env, at the time of migration: Read entities & Read settings & Write settings

### Functionalities (Animated Gifs):

##### Match entities between 2 tenants
![alt text](https://github.com/dcryans/Dynatrace-Config-Manager/blob/master/documentation/gifs/entityFilter_2.gif "Match entities between 2 tenants")

##### Compare entities configurations (by schema)
![alt text](https://github.com/dcryans/Dynatrace-Config-Manager/blob/master/documentation/gifs/Pre-Migrate_v1.gif "Compare entities configurations")


### Setup Steps <a name = "setup-steps"></a>


* Step 1: Installing WSL2 [ONLY DO THIS STEP IF ON WINDOWS, SKIP ON LINUX MACHINE]

install wsl2 https://learn.microsoft.com/en-us/windows/wsl/install

In powershell or cmd
```
wsl --install -d Ubuntu
```

If installing on Windows Server 2019 or older, follow documentation on wsl website


* Step 2: Installing Dependencies

Once wsl is installed, open it setup user info, can be whatever you want, then run the following to install dependencies:
```
sudo apt-get update
sudo apt upgrade
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
sudo apt install -y npm
sudo apt install -y python3
pip3 install --user pipenv
```


To check pipenv installed in the proper path run the following
```
cd ~
cat .profile
```

If the following is at the bottom of the file then you're good:
```
# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
```


* Step 3: Running Application

Now we clone the repo to run it:
```
source .profile
git clone https://github.com/dcryans/Dynatrace-Config-Manager
cd Dynatrace-Config-Manager
cd flask-backend
```

the following command uses the python version you have installed, mine is 3.8.10
```
pipenv install --python 3.8.10 
```

If there is an error running pipenv then run the following:
```
apt remove python3-virtualenv
pip install --user virtualenv --force-reinstall
```

Once pipenv runs sucessfully:
```
sh run_flask.sh
```


At this point backend should be running. Now run frontend portion, open new terminal
```
cd Dynatrace-Config-Manager/react-frontend
npm install
npm start
```

if you get errors about missing packages, update npm and nodejs (running commands above should've gotten newest version)


Command to find size of data file
```
cd flash-backend
cd data
du -h
```


