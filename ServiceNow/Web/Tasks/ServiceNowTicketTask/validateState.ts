import tl = require("vsts-task-lib/task");
import { ServiceNowProvider } from "./serviceNowProvider";
import vsts = require("vso-node-api");
import * as RMInterfaces from "vso-node-api/interfaces/ReleaseInterfaces";
import * as BaseInterfaces from "vso-node-api/interfaces/common/VsoBaseInterfaces";
import * as RMApi from "vso-node-api/ReleaseApi";
import { getValidationConfiguration } from "./taskInputParser";
import * as models from "./serviceNowModels";
import { VSTSProvider } from "./vstsProvider";

export class ValidateState {
    private _configuration: models.IValidateTicketConfiguration;
    private AttachmentType = "servicenow";
    private _vstsProvider: VSTSProvider;

    async validate() {
        let validState = false;
        try {
            this._configuration = getValidationConfiguration();

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
                    tl.debug("Record state is: " + record.state + ". Compared to " + this._configuration.desiredState);
                    validState = record.state.toLowerCase() === this._configuration.desiredState;
                }
            } else if (this._configuration.table === models.ServiceNowConstants.ChangeRequestTable) {
                let record = await client.findRecord<models.helsinki.ChangeTask>(recordNumbers[0]);
                if (record) {
                    tl.debug("Record state is: " + record.state + ". Compared to " + this._configuration.desiredState);
                    validState = record.state.toLowerCase() === this._configuration.desiredState;
                }
            }
        } catch (e) {
            tl.debug(e.message);
            tl.error(e.message);
            tl.setResult(tl.TaskResult.Failed, e.message);
            return;
        }
        if (validState) {
            tl.setResult(tl.TaskResult.Succeeded, "State validated. Task Complete.");
        } else {
            tl.setResult(tl.TaskResult.Failed, "States not validated, failing task. Task Complete.");
        }
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