import * as RMInterfaces from "vso-node-api/interfaces/ReleaseInterfaces";
import { ITFSConfiguration, TaskAttachment } from "./serviceNowModels";
import request = require("request");

interface ICollection<T> {
    count: Number;
    value: T[];
}

export class VSTSProvider {
    private _configuration: ITFSConfiguration;
    constructor(configuration: ITFSConfiguration) {
        this._configuration = configuration;
    }

    getReleaseAttachments(planId: string, resourceType: string): Promise<TaskAttachment[]> {
        let defer = new Promise<TaskAttachment[]>((resolve, reject) => {
            let uri = `${this._configuration.rmUri}${this._configuration.teamProjectId}/_apis/distributedtask/hubs/Release/plans/${planId}/attachments/${resourceType}`;
            this._performHttpAction<ICollection<TaskAttachment>>(uri, this._getJsonHeaders()).then((result) => {
                let attachments: TaskAttachment[] = [];
                if (result && result.value) {
                    attachments = result.value;
                }
                resolve(attachments);
            }).catch(err => {
                reject(err);
            });
        });
        return defer;
    }

    getAttachmentContent<T>(planId: string, resourceType: string, timelineId: string, recordId: string, resourceName: string): Promise<T> {
        let defer = new Promise<T>((resolve, reject) => {
            let uri = `${this._configuration.rmUri}${this._configuration.teamProjectId}/_apis/distributedtask/hubs/Release/plans/${planId}/timelines/${timelineId}/records/${recordId}/attachments/${resourceType}/${resourceName}`;
            this._performHttpAction<T>(uri, this._getOctetHeaders()).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
        return defer;
    }

    private _performHttpAction<T>(url: string, headers: request.Headers): Promise<T> {
        let defer = new Promise<T>((resolve, reject) => {
            let callback: request.RequestCallback = function (err, httpResponse, body) {
                if (err) {
                    reject(err);
                } else if (httpResponse.statusCode < 200 && httpResponse.statusCode >= 300) {
                    reject(httpResponse);
                } else {
                    let response: T = <T>(body.result);
                    if (response) {
                        resolve(response);
                    } else {
                        let parsed: any = JSON.parse(body);
                        response = <T>(parsed);
                        resolve(response);
                    }
                }
            };
            request(url, {
                headers: headers,
                method: "GET",
            }, callback);
        });
        return defer;
    }

    private _getJsonHeaders(): request.Headers {
        let header: request.Headers = null;
        header = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + this._configuration.token
        };
        return header;
    }

    private _getOctetHeaders(): request.Headers {
        let header: request.Headers = null;
        header = {
            "Accept": "application/octet-stream",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + this._configuration.token
        };
        return header;
    }
}