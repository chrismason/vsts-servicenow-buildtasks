/// <reference path="../typings/index.d.ts" />

import tl = require("vsts-task-lib/task");
import path = require("path");
import fs = require("fs");
import * as models from "./models";
import { ValidateStateTaskModels } from "./validateStateTaskModels";
import { ServiceNowClient } from "./serviceNowClient";

async function doWork() {
    let validState = false;
    try {
        tl.debug("Begin task");
        let taskOptions: ValidateStateTaskModels = new ValidateStateTaskModels();
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

        if (taskOptions.table === models.Constants.IncidentTable) {
            tl.debug("Finding incident");

            let record = await client.findRecord<models.helsinki.Incident>(taskOptions.recordNumber);
            if (record) {
                tl.debug("Record state is: " + record.state + ". Compared to " + taskOptions.desiredState);
                validState = record.state.toLowerCase() === taskOptions.desiredState;
            }
            tl.debug("Record validated");
        } else if (taskOptions.table === models.Constants.ChangeRequestTable) {
            tl.debug("Finding change request");

            let record = await client.findRecord<models.helsinki.ChangeTask>(taskOptions.recordNumber);
            if (record) {
                tl.debug("Record state is: " + record.state + ". Compared to " + taskOptions.desiredState);
                validState = record.state.toLowerCase() === taskOptions.desiredState;
            }
            tl.debug("Record validated");
        }
    } catch (e) {
        tl.debug(e.message);
        tl._writeError(e);
        tl.setResult(tl.TaskResult.Failed, e.message);
        return;
    }
    if (validState) {
        tl.setResult(tl.TaskResult.Succeeded, "State validated. Task Complete.");
    } else {
        tl.setResult(tl.TaskResult.Failed, "States not validate, failing task. Task Complete.");
    }
}

doWork();