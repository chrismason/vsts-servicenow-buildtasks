Example set of build / release tasks for VSTS for interacting with [ServiceNow](https://www.servicenow.com) using the [REST API](http://wiki.servicenow.com/index.php?title=Table_API#gsc.tab=0).

This example contains the following 3 example tasks:
- Create ServiceNow Ticket - Creates either an incident or change request object in ServiceNow
- Update ServiceNow Ticket - Allows for updating an existing ticket within ServiceNow
- Validate ServiceNow Ticket State - Validates that the state of a ticket is in a desired value or fails the build