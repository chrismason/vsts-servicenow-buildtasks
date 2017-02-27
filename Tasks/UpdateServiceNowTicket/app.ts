/// <reference path="../typings/index.d.ts" />

import tl = require("vsts-task-lib/task");
import path = require("path");
import fs = require("fs");
import * as models from "./models";
import { UpdateTaskModels } from "./updateTaskModels";
import { ServiceNowClient } from "./serviceNowClient";

async function doWork() {
    try {
        tl.debug("Begin task");
        let taskOptions: UpdateTaskModels = new UpdateTaskModels();
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
            tl.debug("Updating incident");

            let record = await client.findRecord<models.helsinki.Incident>(taskOptions.recordNumber);
            if (record) {
                if (taskOptions.useGenericData) {
                    let parsed: any = JSON.parse(taskOptions.jsonRepresentation);
                    let newRecord = <models.helsinki.Incident>(parsed);
                    let combinedRecord = Object.assign<models.helsinki.Incident, models.helsinki.Incident>(record, newRecord);
                    tl.debug(combinedRecord.sys_id);
                } else {
                    record.short_description = taskOptions.updatedDescription;
                }
                record = await client.updateRecord<models.helsinki.Incident>(record);
                tl.debug("Record updated, checking for attachment");
                if (taskOptions.uploadAttachment) {
                    tl.debug("Adding attachment: " + taskOptions.attachmentFile);
                    let file = path.basename(taskOptions.attachmentFile);
                    record = await client.attachDocumentToRecord<models.helsinki.Incident>({
                        fileName: file,
                        filePath: taskOptions.attachmentFile,
                        id: record.sys_id,
                        recordNumber: record.number
                    });
                    tl.debug("Attachment added");
                }
            } else {
                tl.setResult(tl.TaskResult.Failed, "Failed to find record to update: " + taskOptions.recordNumber);
            }
        } else if (taskOptions.table === models.Constants.ChangeRequestTable) {
            tl.debug("Updating change request");

            let record = await client.findRecord<models.helsinki.ChangeTask>(taskOptions.recordNumber);

            if (taskOptions.useGenericData) {
                let parsed: any = JSON.parse(taskOptions.jsonRepresentation);
                let newRecord = <models.helsinki.ChangeTask>(parsed);
                Object.assign<models.helsinki.ChangeTask, models.helsinki.ChangeTask>(record, newRecord);
            } else {
                record.short_description = taskOptions.updatedDescription;
            }

            record = await client.updateRecord<models.helsinki.ChangeTask>(record);
            tl.debug("Record updated, checking for attachment");
            if (taskOptions.uploadAttachment) {
                tl.debug("Adding attachment: " + taskOptions.attachmentFile);
                let file = path.basename(taskOptions.attachmentFile);
                record = await client.attachDocumentToRecord<models.helsinki.ChangeTask>({
                    fileName: file,
                    filePath: taskOptions.attachmentFile,
                    id: record.sys_id,
                    recordNumber: record.number
                });
                tl.debug("Attachment added");
            }
            tl.debug("Record updated");
        }
    } catch (e) {
        tl.debug(e.message);
        tl._writeError(e);
        tl.setResult(tl.TaskResult.Failed, e.message);
        return;
    }
    tl.setResult(tl.TaskResult.Succeeded, "Task complete");
}

doWork();