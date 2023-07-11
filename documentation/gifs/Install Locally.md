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

