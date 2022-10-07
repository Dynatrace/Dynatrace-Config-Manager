# Dynatrace-Config-Manager

### ALPHA VERSION

##### Disclaimer:

* I made my code available to everyone, but this project is not stable for now.
* Error management is minimal, this should be fixed soon.
* It is not officially supported in any way by Dynatrace or myself.
* Use at your own risks.

### Vision:
I am working towards a "one click migration" for all oneangents and and of their tenant's configuration to another tenant.

### Access Tokens
It is required that you use an access token with these scopes:
* Minimal: Read entities & Read settings
* Target Env, at the time of migration: Read entities & Read settings & Write entities & Write settings

### Functionalities (Animated Gifs):

##### Match entities between 2 tenants
![alt text](https://github.com/dcryans/Dynatrace-Config-Manager/blob/master/entityFilter_2.gif "Match entities between 2 tenants")

##### Compare entities configurations (by schema)
![alt text](https://github.com/dcryans/Dynatrace-Config-Manager/blob/master/Pre-Migrate_v1.gif "Compare entities configurations")


