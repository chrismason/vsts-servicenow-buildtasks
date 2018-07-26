/// <reference types="vss-web-extension-sdk" />
import * as Service from "VSS/Service";
import * as DTRest from "TFS/DistributedTask/TaskRestClient";
import { TaskAttachment } from "TFS/DistributedTask/Contracts";
import * as Q from "q";

export class DistributedTaskService extends Service.VssService {
    private hubname = "Release";
    private _scriptRequirePromise: Q.Promise<boolean>;
    private _httpClient: DTRest.TaskHttpClient;

    public initializeConnection(connection: Service.VssConnection) {
        super.initializeConnection(connection);
        let defer = Q.defer<boolean>();
        this._scriptRequirePromise = defer.promise;
        VSS.require(["TFS/DistributedTask/TaskRestClient", "ReleaseManagement/Core/RestClient"], (TaskClient, RMClient) => {
            this._httpClient = connection.getHttpClient<DTRest.TaskHttpClient>(TaskClient.TaskHttpClient, RMClient.ReleaseHttpClient.serviceInstanceId);
            defer.resolve(true);
        });
    }

    public getPlanAttachments(planId: string, type: string): IPromise<TaskAttachment[]> {
        return this._scriptRequirePromise.then(() => {
            let projectId = VSS.getWebContext().project.id;
            return this._httpClient.getPlanAttachments(projectId, this.hubname, planId, type);
        });
    }

    public getAttachmentContent(planId: string, attachment: TaskAttachment): IPromise<string> {
        return this._scriptRequirePromise.then(() => {
            let projectId = VSS.getWebContext().project.id;
            return this._httpClient.getAttachmentContent(projectId, this.hubname, planId, attachment.timelineId, attachment.recordId, attachment.type, attachment.name).then(content => {
                return String.fromCharCode.apply(null, new Uint8Array(content));
            }, error => {
                return "";
            });
        });
    }
}

export function getDistributedTaskService(): DistributedTaskService {
    let connection = new Service.VssConnection(VSS.getWebContext());
    let service = new DistributedTaskService();
    service.initializeConnection(connection);
    return service;
}