import tl = require("vsts-task-lib/task");
import path = require("path");
import fs = require("fs");
import * as models from "./models";
import * as createModels from "./createTaskModels";
import { ServiceNowClient } from "./serviceNowClient";

async function doWork() {
    try {
        tl.debug("Starting task");
        let taskOptions: createModels.CreateTaskOptions = new createModels.CreateTaskOptions();
        tl.debug("Loaded options");
        let client: ServiceNowClient = new ServiceNowClient(taskOptions);
        tl.debug("Created client");

        if (!taskOptions.useBasicAuth()) {
            tl.debug("Generating oauth tokens");
            let auth = await client.authenticate();
            if (!auth.access_token) {
                tl.setResult(tl.TaskResult.Failed, "Unable to obtain authorization token");
                return;
            }
            tl.debug("Failed to authenticate through oauth");
        }

        let itemUrl = "";
        let record: models.helsinki.ISystemRecord;

        if (taskOptions.table === models.Constants.IncidentTable) {
            let incident: models.helsinki.Incident;
            if (taskOptions.useGenericData) {
                let parsed: any = JSON.parse(taskOptions.jsonRepresentation);
                incident = <models.helsinki.Incident>(parsed);
            } else {
                incident = {
                    short_description: taskOptions.incidentOptions.shortDescription,
                    urgency: taskOptions.incidentOptions.urgency,
                    impact: taskOptions.incidentOptions.impact
                };
            }
            incident = await client.createRecord<models.helsinki.Incident>(incident);
            record = incident;
        } else if (taskOptions.table === models.Constants.ChangeRequestTable) {
            let change: models.helsinki.ChangeTask;

            if (taskOptions.useGenericData) {
                let parsed: any = JSON.parse(taskOptions.jsonRepresentation);
                change = <models.helsinki.ChangeTask>(parsed);
            } else {
                change = {
                    short_description: taskOptions.changeOptions.shortDescription
                };
            };
            change = await client.createRecord<models.helsinki.ChangeTask>(change);
            record = change;
        }

        itemUrl = client.getItemLocation(record.sys_id);
        createSummary(record.number, itemUrl);
        if (taskOptions.shouldStoreRecord) {
            tl.setVariable(taskOptions.recordVariable, record.number);
        }
    } catch (e) {
        tl.debug(e.message);
        tl._writeError(e);
        tl.setResult(tl.TaskResult.Failed, e.message);
        return;
    }
    tl.setResult(tl.TaskResult.Succeeded, "Task complete");
}

function createSummary(recordNumber: string, url: string) {
    let reportText = buildSummaryReport(recordNumber, url);
    uploadReport("servicenowticket.md", reportText);
}

function buildSummaryReport(recordNumber: string, url: string): string {
    let summary = "";
    summary += "ServiceNow supporting ticket: [" + recordNumber + "](" + url + ")";

    return summary;
}

function uploadReport(summaryFile: string, text: string) {
    let stagingFolder: string = tl.getVariable("System.DefaultWorkingDirectory");

    tl.debug("Changing to " + stagingFolder);
    tl.cd(stagingFolder);
    tl.debug("Writing contents to: " + summaryFile);
    fs.writeFileSync(summaryFile, text);
    tl.debug("Wrote file");

    let targetFile = path.join(stagingFolder, summaryFile);
    if (tl.exist(targetFile)) {
        tl.debug("File is at: " + targetFile);
    } else {
        tl._writeError("File not found at " + targetFile);
    }

    let data = {
        type: "Distributedtask.Core.Summary",
        name: "ServiceNow Ticket"
    };

    tl.command("task.addattachment", data, targetFile);
}

doWork();