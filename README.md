# Dynatrace Config Manager

*Please note: this is a community developed application. It is provided without any representations, warranties, or support from Dynatrace. If you have questions about this app, please post on our forum or create an [issue](https://github.com/dcryans-dynatrace/Dynatrace-Config-Manager/issues) on Github*

## Why?
Moving configs from tenant to tenant is not a simple task.
<br>This tool has been built in order to help every Dynatrace enthusiasts get as much value as possible from their platform.

## Getting started
[Download terraform.exe](https://developer.hashicorp.com/terraform/downloads) and [add it to your path](https://stackoverflow.com/questions/1618280/where-can-i-set-path-to-make-exe-on-windows)
<br>Watch the [Youtube quick start from Omar Zaal](https://www.youtube.com/watch?v=h__0826oJ5o).
<br>You can download the tool from the [Latest Release page](https://github.com/dcryans/Dynatrace-Config-Manager/releases/latest)

## Access Token hygiene
This tool is not using a Vault to store your access tokens.
<br>It is recommended that the tokens you create have a 24 hours life span and that you delete them when you are done using the tool.

## Technologies
**TerraComposer: Reveal terraform's hidden potential**
TerraComposer manipulates terraform files and state to create new functionalities.
- Apply configurations from Source tenant to Target tenant.
- Create terraform states from existing configurations.
- Multi Targeting: Plan and apply only a specified set of configuration and their dependencies, at lightning speed.
- Omit Destroy: Push new configurations and changes without destroying existing unrelated configurations.

**OneTopology: Precision at scale**
OneTopology processes reconcile Source tenant topology with Target tenant topology, as One Topology.
- Configurations from the Source tenant will land on the right entities, even if their IDs change during the migration process (Host, Synthetic test, Application, Service, etc.).
- It is optimised for speed and precision.
- Ensures that you will not be limited to the Config Manager.
- You can keep using Configuration as Code (aka Monaco), Terraform or UI screens in parallel without breaking Config Manager functionalities.


## Feeling creative?
You can also [install the tool Locally](https://github.com/dcryans/Dynatrace-Config-Manager/blob/master/documentation/gifs/Install%20Locally.md), but this is only meant for commiters.
