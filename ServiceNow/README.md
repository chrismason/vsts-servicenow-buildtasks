# ServiceNow Extensions

## Overview

This is a set of build / release tasks for VSTS for interacting with [ServiceNow](https://www.servicenow.com) using the [REST API](http://wiki.servicenow.com/index.php?title=Table_API#gsc.tab=0).

This implementation contains the following 3 tasks:
- Create ServiceNow Ticket - Creates either an incident or change request object in ServiceNow
- Update ServiceNow Ticket - Allows for updating an existing ticket within ServiceNow
- Validate ServiceNow Ticket State - Validates that the state of a ticket is in a desired value or fails the build

In supplement the build and release tasks, this extension also adds ServiceNow specific endpoints to the TFS service endpoints. These endpoint support both OAuth and Basic authentication.

## Code Structure

## TFS
Build and release task extensions are available in the `web\tasks` folder. Each task is broken into its subsequent folder.

## ServiceNow
ServiceNow specific code is available in the `service\` folder.
