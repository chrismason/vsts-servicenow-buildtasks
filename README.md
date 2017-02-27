# Service Now VSTS / TFS Build Tasks
Example set of build / release tasks for VSTS for interacting with [ServiceNow](https://www.servicenow.com) using the [REST API](http://wiki.servicenow.com/index.php?title=Table_API#gsc.tab=0).

This example contains the following 3 example tasks:
- Create ServiceNow Ticket - Creates either an incident or change request object in ServiceNow
- Update ServiceNow Ticket - Allows for updating an existing ticket within ServiceNow
- Validate ServiceNow Ticket State - Validates that the state of a ticket is in a desired value or fails the build

These tasks are example implementations, they are not production ready nor are they fully featured. It is expected that each ServiceNow environment may have its own configuration and these tasks would need to be modified for those environments. The focus here is to illustrate that these kinds of communications are possible.

# Getting Started
## ServiceNow
- Register for a developer instance at [ServiceNow's developer site](https://developer.servicenow.com/app.do#!/home)
- Provision a user in ServiceNow
    - Set user as web service access only and internal integration user
- Add roles
    - Rest_api_explorer
    - Web_service_admin
    - itil
- If you wish to use OAuth you need to do the following steps
    - In system plugins, make sure OAuth 2.0 is active
    - In sys_properties.list, the following flag should be present, if not, add it: com.snc.platform.security.oauth.is.active
        - Name: com.snc.platform.security.oauth.is.active
        - Type: True | False
        - Default: True
    - In the OAuth module, go to the application registry
        - Create a new external client
        - Get the client ID and secret

## VSCode
### Environment
- Install VS Code from [here](https://code.visualstudio.com/)
- Install NodeJS from [here](https://nodejs.org)
- Clone this repository
- Create a publisher at the [VSTS marketplace](https://marketplace.visualstudio.com/manage)
- Choose an ID for your extension and insert it in `vss-extension.json`
- Get a personal access token with permissions to publish to the marketplace and place that token in the `package.json` on the line `publish:tasks`
- Run `npm run initdev`
- Run `npm run build:tasks` to build the tasks.
- Run `npm run package:tasks` to generate the vsix file.
- Run `npm run publish:tasks` to publish to the marketplace.

### Debugging
In `launch.json` you can use the values for your ServiceNow environment for the instance name, REST service account, OAuth client IDs, etc.

In each launch configuraiton, there is a flag `INPUT_LOCALDEVELOPMENT` set to true which bypasses the logic to read from VSTS service endpoints. This allows you to inject the ServiceNow details locally without needing a VSTS service endpoint.