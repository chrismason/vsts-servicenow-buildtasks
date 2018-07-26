/// <reference types="vss-web-extension-sdk" />
import * as Q from "q";
import * as DTRest from "TFS/DistributedTask/TaskRestClient";
import { TaskAttachment } from "TFS/DistributedTask/Contracts";
import { ExtensionDataService } from "VSS/SDK/Services/ExtensionData";
import { IServiceNowCredentials, ICreatedTicket } from "../Models/ServiceNow";
import { IReleaseViewExtensionConfig } from "ReleaseManagement/Core/ExtensionContracts";
import { Release, ReleaseDeployPhase, DeploymentAttempt, ReleaseEnvironment } from "ReleaseManagement/Core/Contracts";
import { getDistributedTaskService, DistributedTaskService } from "./DistributedTaskService";

export interface IVSTSConfigurationProvider {
    getCreatedTickets(): IPromise<ICreatedTicket[]>;
}

export class VSTSConfigurationProvider implements IVSTSConfigurationProvider {
    private _context: WebContext;
    private _configuration: IReleaseViewExtensionConfig;

    private scope = "Default";
    private username = "username";
    private password = "password";
    private url = "url";
    private attachmentType = "servicenow";
    private unknown = "";

    constructor() {
        this._configuration = <IReleaseViewExtensionConfig>VSS.getConfiguration();
        this._context = VSS.getWebContext();
    }

    getCreatedTickets(): IPromise<ICreatedTicket[]> {
        let defer = Q.defer<ICreatedTicket[]>();
        this._configuration.onReleaseChanged(release => {
            this._getReleaseAttachments(release).then(attachments => {
                defer.resolve(attachments);
            }, error => {
                defer.reject(error);
            });
        });
        return defer.promise;
    }

    private _getReleaseAttachments(release: Release): IPromise<ICreatedTicket[]> {
        let defer = Q.defer<ICreatedTicket[]>();
        let attachmentItemsPromises: Q.IPromise<Q.IPromise<ICreatedTicket>[]>[] = new Array();
        release.environments.forEach(env => {
            let lastDeployment = this._getLastDeploymentAttempt(env.deploySteps);
            if (lastDeployment) {
                lastDeployment.releaseDeployPhases.forEach(phase => {
                    attachmentItemsPromises.push(this._getAttachmentsByPhase(env, phase));
                });
            }
        });

        Q.allSettled(attachmentItemsPromises).then(attachmentItemsResults => {
            let attachmentItemsContentPromises: Q.IPromise<ICreatedTicket>[] = new Array();
            attachmentItemsResults.forEach(attachmentResult => {
                if (attachmentResult.value && attachmentResult.value.length > 0) {
                    attachmentItemsContentPromises = attachmentItemsContentPromises.concat(attachmentResult.value);
                }
            });

            Q.allSettled(attachmentItemsContentPromises).then(attachmentItemsContentResults => {
                let tickets: ICreatedTicket[] = new Array();
                attachmentItemsContentResults.forEach(result => {
                    if (result.value) {
                        tickets.push(result.value);
                    }
                });
                defer.resolve(tickets);
            });
        });
        return defer.promise;
    }

    private _getLastDeploymentAttempt(deploySteps: DeploymentAttempt[]): DeploymentAttempt {
        if (deploySteps && deploySteps.length > 0) {
            deploySteps = deploySteps.sort((a, b) => {
                return b.attempt - a.attempt;
            });
            return deploySteps[0];
        }
        return null;
    }

    private _getAttachmentsByPhase(environment: ReleaseEnvironment, phase: ReleaseDeployPhase): Q.IPromise<Q.IPromise<ICreatedTicket>[]> {
        let defer = Q.defer<Q.IPromise<ICreatedTicket>[]>();
        let service = getDistributedTaskService();
        let attachmentContentPromises: Q.IPromise<ICreatedTicket>[] = new Array();

        service.getPlanAttachments(phase.runPlanId, this.attachmentType).then(attachmentItems => {
            attachmentItems.forEach(attachmentItem => {
                attachmentContentPromises.push(this._getAttachmentContent(attachmentItem, phase.runPlanId));
            });
            return defer.resolve(attachmentContentPromises);
        });
        return defer.promise;
    }

    private _getAttachmentContent(attachment: TaskAttachment, planId: string): Q.IPromise<ICreatedTicket> {
        let defer = Q.defer<ICreatedTicket>();
        let attachmentContentPromises = new Array();

        let service = getDistributedTaskService();
        service.getAttachmentContent(planId, attachment)
            .then(content => {
                let ticket: ICreatedTicket = JSON.parse(content);
                defer.resolve(ticket);
            }, defer.reject);

        return defer.promise;
    }
}