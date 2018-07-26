import tl = require("vsts-task-lib/task");
import path = require("path");
import { ServiceNowProvider } from "./serviceNowProvider";
import vsts = require("vso-node-api");
import * as RMInterfaces from "vso-node-api/interfaces/ReleaseInterfaces";
import * as BaseInterfaces from "vso-node-api/interfaces/common/VsoBaseInterfaces";
import * as RMApi from "vso-node-api/ReleaseApi";
import { getUpdateTicketConfiguration } from "./taskInputParser";
import * as models from "./serviceNowModels";
import { VSTSProvider } from "./vstsProvider";

export class UpdateTicket {
    private _configuration: models.IUpdateTicketConfiguration;
    private AttachmentType = "servicenow";
    private _vstsProvider: VSTSProvider;

    async updateTicket() {
        try {
            this._configuration = getUpdateTicketConfiguration();

            this._vstsProvider = new VSTSProvider(this._configuration.tfsConfiguration);
            let connection = new vsts.WebApi(this._configuration.tfsConfiguration.rmUri, this.getAuthHandler());
            let releaseApi = connection.getReleaseApi();

            let release = await releaseApi.getRelease(this._configuration.tfsConfiguration.teamProject, this._configuration.tfsConfiguration.releaseId);
            let recordNumbers = await this.getReleaseAttachments(release);
            if (!recordNumbers || recordNumbers.length === 0) {
                tl.setResult(tl.TaskResult.Failed, "Could not find existing ServiceNow record");
                return;
            }

            let client: ServiceNowProvider = new ServiceNowProvider(this._configuration);
            tl.debug("Created client");

            if (this._configuration.serviceNowConnection.mode === models.ServiceNowAuthenticationMode.oauth) {
                let auth = await client.authenticate();
                if (!auth.access_token) {
                    tl.setResult(tl.TaskResult.Failed, "Unable to obtain authorization token");
                    return;
                }
            }

            if (this._configuration.table === models.ServiceNowConstants.IncidentTable) {
                let record = await client.findRecord<models.helsinki.Incident>(recordNumbers[0]);
                if (record) {
                    if (this._configuration.useGenericData) {
                        let parsed: any = JSON.parse(this._configuration.jsonRepresentation);
                        let newRecord = <models.helsinki.Incident>(parsed);
                        let combinedRecord = Object.assign<models.helsinki.Incident, models.helsinki.Incident>(record, newRecord);
                        tl.debug(combinedRecord.sys_id);
                    } else {
                        record.short_description = this._configuration.updatedDescription;
                    }
                    record = await client.updateRecord<models.helsinki.Incident>(record);
                    if (this._configuration.uploadAttachment) {
                        tl.debug("Adding attachment: " + this._configuration.attachmentFile);
                        let file = path.basename(this._configuration.attachmentFile);
                        record = await client.attachDocumentToRecord<models.helsinki.Incident>({
                            fileName: file,
                            filePath: this._configuration.attachmentFile,
                            id: record.sys_id,
                            recordNumber: record.number
                        });
                        tl.debug("Attachment added");
                    }
                } else {
                    tl.setResult(tl.TaskResult.Failed, "Failed to find record to update: " + recordNumbers[0]);
                }
            } else if (this._configuration.table === models.ServiceNowConstants.ChangeRequestTable) {
                tl.debug("Updating change request");

                let record = await client.findRecord<models.helsinki.ChangeTask>(recordNumbers[0]);

                if (this._configuration.useGenericData) {
                    let parsed: any = JSON.parse(this._configuration.jsonRepresentation);
                    let newRecord = <models.helsinki.ChangeTask>(parsed);
                    Object.assign<models.helsinki.ChangeTask, models.helsinki.ChangeTask>(record, newRecord);
                } else {
                    record.short_description = this._configuration.updatedDescription;
                }

                record = await client.updateRecord<models.helsinki.ChangeTask>(record);
                if (this._configuration.uploadAttachment) {
                    tl.debug("Adding attachment: " + this._configuration.attachmentFile);
                    let file = path.basename(this._configuration.attachmentFile);
                    record = await client.attachDocumentToRecord<models.helsinki.ChangeTask>({
                        fileName: file,
                        filePath: this._configuration.attachmentFile,
                        id: record.sys_id,
                        recordNumber: record.number
                    });
                    tl.debug("Attachment added");
                }
                tl.debug("Record updated");
            }
        } catch (e) {
            tl.debug(e.message);
            tl.error(e.message);
            tl.setResult(tl.TaskResult.Failed, e.message);
            return;
        }
        tl.setResult(tl.TaskResult.Succeeded, "Task complete");
    }

    private getAuthHandler() {
        let authHandler: BaseInterfaces.IRequestHandler = null;
        authHandler = vsts.getPersonalAccessTokenHandler(this._configuration.tfsConfiguration.token);
        return authHandler;
    }

    private async getReleaseAttachments(release: RMInterfaces.Release): Promise<string[]> {
        let recordNumbers: string[] = [];
        for (let env of release.environments) {
            if (env.status === RMInterfaces.EnvironmentStatus.Succeeded ||
                env.status === RMInterfaces.EnvironmentStatus.PartiallySucceeded ||
                env.status === RMInterfaces.EnvironmentStatus.InProgress) {
                let lastDeployment = this.getLastDeploymentAttempt(env.deploySteps);
                for (let phase of lastDeployment.releaseDeployPhases) {
                    if (phase.status === RMInterfaces.DeployPhaseStatus.Succeeded ||
                        phase.status === RMInterfaces.DeployPhaseStatus.PartiallySucceeded ||
                        phase.status === RMInterfaces.DeployPhaseStatus.InProgress) {
                        let attachments = await this._vstsProvider.getReleaseAttachments(phase.runPlanId, this.AttachmentType);
                        if (attachments) {
                            for (let attachmentEntry of attachments) {
                                let content = await this._vstsProvider.getAttachmentContent<models.IServiceNowAttachment>(phase.runPlanId, this.AttachmentType, attachmentEntry.timelineId, attachmentEntry.recordId, attachmentEntry.name);
                                if (content) {
                                    recordNumbers.push(content.ticketNumber);
                                }
                            }
                        }
                    }
                }
            }
        }
        return recordNumbers;
    }

    private getLastDeploymentAttempt(deploySteps: RMInterfaces.DeploymentAttempt[]): RMInterfaces.DeploymentAttempt {
        if (deploySteps && deploySteps.length > 0) {
            deploySteps = deploySteps.sort((a, b) => {
                return b.attempt - a.attempt;
            });
            return deploySteps[0];
        }
        return null;
    }
}