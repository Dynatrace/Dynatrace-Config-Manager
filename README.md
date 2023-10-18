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

## Feeling creative?
You can also [install the tool Locally](https://github.com/dcryans/Dynatrace-Config-Manager/blob/master/documentation/gifs/Install%20Locally.md), but this is only meant for commiters.
