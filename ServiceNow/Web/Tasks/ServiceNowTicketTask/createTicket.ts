import tl = require("vsts-task-lib/task");
import path = require("path");
import fs = require("fs");
import { ServiceNowProvider } from "./serviceNowProvider";
import vsts = require("vso-node-api");
import * as RMInterfaces from "vso-node-api/interfaces/ReleaseInterfaces";
import * as BaseInterfaces from "vso-node-api/interfaces/common/VsoBaseInterfaces";
import * as RMApi from "vso-node-api/ReleaseApi";
import { getCreateTicketConfiguration } from "./taskInputParser";
import * as models from "./serviceNowModels";
import { VSTSProvider } from "./vstsProvider";

export class CreateTicket {
    private _configuration: models.ICreateTicketConfiguration;

    async createTicket() {
        try {
            this._configuration = getCreateTicketConfiguration();

            let client: ServiceNowProvider = new ServiceNowProvider(this._configuration);
            tl.debug("Created client");

            if (this._configuration.serviceNowConnection.mode === models.ServiceNowAuthenticationMode.oauth) {
                let auth = await client.authenticate();
                if (!auth.access_token) {
                    tl.setResult(tl.TaskResult.Failed, "Unable to obtain authorization token");
                    return;
                }
            }

            let itemUrl = "";
            let record: models.helsinki.ISystemRecord;

            if (this._configuration.table === models.ServiceNowConstants.ChangeRequestTable) {
                let change: models.helsinki.ChangeTask;

                if (this._configuration.useGenericData) {
                    let parsed: any = JSON.parse(this._configuration.jsonRepresentation);
                    change = <models.helsinki.ChangeTask>(parsed);
                } else {
                    change = {
                        short_description: this._configuration.description
                    };
                }
                change = await client.createRecord<models.helsinki.ChangeTask>(change);
                record = change;
            }

            itemUrl = client.getItemLocation(record.sys_id);
            this.createSummary(record.number, itemUrl, this._configuration.table);
            if (this._configuration.storeResult) {
                tl.setVariable(this._configuration.storeVariable, record.number);
            }
        } catch (e) {
            tl.debug(e.message);
            tl.error(e.message);
            tl.setResult(tl.TaskResult.Failed, e.message);
            return;
        }
        tl.setResult(tl.TaskResult.Succeeded, "Task complete");
    }

    private createSummary(recordNumber: string, url: string, tableName: string) {
        let reportText = this.buildSummaryReport(recordNumber, url, tableName);
        this.uploadReport("servicenowticket.json", reportText);
    }

    private buildSummaryReport(recordNumber: string, url: string, tableName: string): string {
        let ticketInfo: models.IServiceNowAttachment = {
            tableName: tableName,
            ticketNumber: recordNumber,
            url: url
        };
        let summary = JSON.stringify(ticketInfo);

        return summary;
    }

    private uploadReport(summaryFile: string, text: string) {
        let stagingFolder: string = tl.getVariable("System.DefaultWorkingDirectory");

        tl.cd(stagingFolder);
        fs.writeFileSync(summaryFile, text);

        let targetFile = path.join(stagingFolder, summaryFile);

        let data = {
            type: "servicenow",
            name: "ServiceNowSummary"
        };

        tl.command("task.addattachment", data, targetFile);
    }
}