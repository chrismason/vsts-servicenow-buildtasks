import { ICreatedTicket, ITicketStatus, ITicketStage, StageStatus, IServiceNowCredentials } from "../Models/ServiceNow";
// import { IVSTSConfigurationProvider } from "./VSTSProvider";
import { fetch } from "domain-task";
import * as Constants from "../Models/Constants";
import * as Q from "q";
import { TaskAgentHttpClient } from "TFS/DistributedTask/TaskAgentRestClient";
import * as DTContracts from "TFS/DistributedTask/Contracts";
import { getDefaultWebContext } from "VSS/Context";
import { VssConnection } from "VSS/Service";
import * as PlatformContracts from "VSS/Common/Contracts/Platform";

interface IServiceNowRecord {
    number?: string;
    sys_id?: string;
    short_description: string;
    state?: string;
}

interface ITicketStageMapping extends ITicketStage {
    snowState: string;
}

export interface IServiceNowProvider {
    getTicketDetails(tickets: ICreatedTicket[]): IPromise<ITicketStatus[]>;
}

export class ServiceNowProvider implements IServiceNowProvider {
    // private tableUrl: string = "api/now/table/";
    private _taskHttpClient: TaskAgentHttpClient;

    constructor() {
    }

    getTicketDetails(tickets: ICreatedTicket[]): IPromise<ITicketStatus[]> {
        let defer = Q.defer<ITicketStatus[]>();

        let resolvedTickets: ITicketStatus[] = [];

        if (!tickets || tickets.length === 0) {
            defer.resolve(new Array());
        } else {
            this.getTaskHttpClient().getServiceEndpoints(VSS.getWebContext().project.id).then(endpoints => {
                endpoints = endpoints.filter(e => e.type === "servicenow-basic-key");
                let serviceNowEndpoint: DTContracts.ServiceEndpoint = null;
                if (endpoints && endpoints.length > 0) {
                    serviceNowEndpoint = endpoints[0];
                }
                if (!serviceNowEndpoint) {
                    defer.reject("No service endpoint for ServiceNow has been defined");
                } else {
                    let ticketResolutionPromises: Q.IPromise<DTContracts.ServiceEndpointRequestResult>[] = new Array();
                    tickets.forEach(ticket => {
                        let request = this.getServiceNowTicketServiceEndpointRequest(ticket.ticketNumber);
                        ticketResolutionPromises.push(this.getTaskHttpClient().executeServiceEndpointRequest(request, VSS.getWebContext().project.id, serviceNowEndpoint.id));
                    });
                    Q.all(ticketResolutionPromises).then(requestResults => {
                        let statusResolutionPromises: Q.IPromise<ITicketStatus>[] = [];
                        requestResults.forEach(requestResult => {
                            if (requestResult.statusCode.toLowerCase() === "ok") {
                                let record = JSON.parse(requestResult.result[0]) as IServiceNowRecord;
                                if (record) {
                                    statusResolutionPromises.push(this._recordToTicketStatus(record));
                                }
                            }
                        });
                        Q.all(statusResolutionPromises).then(statusResults => {
                            statusResults.forEach(statusResult => {
                                let matchedTickets = tickets.filter(t => t.ticketNumber === statusResult.ticketNumber);
                                if (matchedTickets && matchedTickets.length > 0) {
                                    statusResult.url = matchedTickets[0].url;
                                }
                                resolvedTickets.push(statusResult);
                            });
                            defer.resolve(resolvedTickets);
                        }).fail(error => {
                            defer.reject(error);
                        });
                    }).fail(error => {
                        defer.reject(error);
                    });
                }
            });
        }

        return defer.promise;
    }

    private getServiceNowTicketServiceEndpointRequest(ticketNumber: string): DTContracts.ServiceEndpointRequest {
        let parameters: { [key: string]: string } = {
            "ChangeRequestNumber": ticketNumber
        };

        let dataSourceDetails: DTContracts.DataSourceDetails = {
            dataSourceName: "ChangeRequests",
            dataSourceUrl: null,
            parameters: parameters,
            resultSelector: null,
            resourceUrl: null
        };

        let resultTransformationDetails: DTContracts.ResultTransformationDetails = {
            resultTemplate: null
        };

        let serviceEndpointRequest: DTContracts.ServiceEndpointRequest = {
            serviceEndpointDetails: null,
            dataSourceDetails: dataSourceDetails,
            resultTransformationDetails: resultTransformationDetails
        };

        return serviceEndpointRequest;
    }

    private _recordToTicketStatus(record: IServiceNowRecord): Q.IPromise<ITicketStatus> {
        let defer = Q.defer<ITicketStatus>();
        this._getAvailableStages().then(stages => {
            let stageList: ITicketStage[] = [];
            stages.forEach(stage => {
                if ((Number(stage.snowState) < Number(record.state)) || (Number(record.state) === 3)) {
                    stage.status = StageStatus.Complete;
                } else if (Number(stage.snowState) === Number(record.state)) {
                    stage.status = StageStatus.InProgress;
                }
                stageList.push(stage);
            });
            let ticket: ITicketStatus = {
                ticketNumber: record.number,
                stages: stageList,
                url: ""
            };
            defer.resolve(ticket);
        });
        return defer.promise;
    }

    private _getAvailableStages(): Q.IPromise<ITicketStageMapping[]> {
        let defer = Q.defer<ITicketStageMapping[]>();
        let stages: ITicketStageMapping[] = [];
        stages.push({
            stageName: "New",
            status: StageStatus.NotStarted,
            snowState: "-5"
        });
        stages.push({
            stageName: "Assess",
            status: StageStatus.NotStarted,
            snowState: "-4"
        });
        stages.push({
            stageName: "Authorize",
            status: StageStatus.NotStarted,
            snowState: "-3"
        });
        stages.push({
            stageName: "Scheduled",
            status: StageStatus.NotStarted,
            snowState: "-2"
        });
        stages.push({
            stageName: "Implement",
            status: StageStatus.NotStarted,
            snowState: "-1"
        });
        stages.push({
            stageName: "Review",
            status: StageStatus.NotStarted,
            snowState: "0"
        });
        stages.push({
            stageName: "Closed",
            status: StageStatus.NotStarted,
            snowState: "3"
        });
        defer.resolve(stages);
        return defer.promise;
    }

    private getTaskHttpClient(): TaskAgentHttpClient {
        if (!this._taskHttpClient) {
            let webContext = getDefaultWebContext();
            let connection = new VssConnection(webContext, PlatformContracts.ContextHostType.ProjectCollection);
            this._taskHttpClient = connection.getHttpClient(TaskAgentHttpClient);
        }
        return this._taskHttpClient;
    }
}