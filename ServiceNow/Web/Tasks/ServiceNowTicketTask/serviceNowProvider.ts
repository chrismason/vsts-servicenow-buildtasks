import tl = require("vsts-task-lib/task");
import request = require("request");
import * as models from "./serviceNowModels";
import Q = require("q");
import fs = require("fs");

export class ServiceNowProvider {
    private authenticationUrl: string = "oauth_token.do";
    private tableUrl: string = "api/now/table/";
    private attachmentUrl: string = "api/now/attachment/file";
    private accessToken: string;

    constructor(private configuration: models.IServiceNowConfiguration) {

    }

    authenticate(): Q.Promise<models.IAuthentication> {
        let defer: Q.Deferred<models.IAuthentication> = Q.defer<models.IAuthentication>();
        let thisClient: ServiceNowProvider = this;

        if (this.isBasicAuth()) {
            defer.reject("Connection is configured for basic authorization");
        }

        request.post({
            url: thisClient.configuration.serviceNowConnection.serverEndpointUrl + thisClient.authenticationUrl,
            form: {
                grant_type: "password",
                client_id: thisClient.configuration.serviceNowConnection.clientId,
                client_secret: thisClient.configuration.serviceNowConnection.clientSecret,
                username: thisClient.configuration.serviceNowConnection.userAccount,
                password: thisClient.configuration.serviceNowConnection.userPassword
            },
            strictSSL: false
        }, (err, httpResponse, body) => {
            if (err) {
                defer.reject(err);
            } else if (httpResponse.statusCode !== 200) {
                defer.reject(httpResponse);
            } else {
                let parsedBody: models.IAuthentication = JSON.parse(body);
                thisClient.accessToken = parsedBody.access_token;
                defer.resolve(parsedBody);
            }
        });
        return defer.promise;
    }

    async createRecord<T>(record: T): Promise<T> {
        let url = this.configuration.serviceNowConnection.serverEndpointUrl + this.tableUrl + this.configuration.table;

        let result = await this._performHttpAction<T>(url, 201, "POST", record);
        return result;
    }

    async findRecord<T extends models.helsinki.ISystemRecord>(recordNumber: string): Promise<T> {
        tl.debug("Getting record to update");
        let url = this.configuration.serviceNowConnection.serverEndpointUrl + this.tableUrl + this.configuration.table;
        url += "?sysparm_query=number%3D" + recordNumber + "&syparm_limit=1";

        let item: T = null;
        let result = await this._performHttpAction<Array<T>>(url);
        if (result && result.length > 0) {
            item = result[0];
            tl.debug("Retrieved record");
        } else {
            tl.debug("Failed to retrieve item");
        }
        return item;
    }

    async updateRecord<T extends models.helsinki.ISystemRecord>(newRecord: T): Promise<T> {
        let updatedRecord = await this._updateRecord<T>(newRecord);
        tl.debug("Updated record");
        return updatedRecord;
    }

    async attachDocumentToRecord<T extends models.helsinki.ISystemRecord>(options: models.IAttachmentOptions): Promise<T> {
        if (!options.id) {
            let record: T = await this.findRecord<T>(options.recordNumber);
            options.id = record.sys_id;
        }
        let result = await this._addAttachment<T>(options);
        return result;
    }

    private _addAttachment<T extends models.helsinki.ISystemRecord>(options: models.IAttachmentOptions): Q.Promise<T> {
        let url = this.configuration.serviceNowConnection.serverEndpointUrl + this.attachmentUrl;
        url += "?table_name=" + this.configuration.table + "&table_sys_id=" + options.id + "&file_name=" + options.fileName;

        let defer: Q.Deferred<T> = Q.defer<T>();
        let thisClient: ServiceNowProvider = this;

        if (!this.isBasicAuth() && !this.accessToken) {
            defer.reject("Not authenticated");
        } else {
            let callback: request.RequestCallback = function (err, httpResponse, body) {
                if (err) {
                    defer.reject(err);
                } else if (httpResponse.statusCode !== 201) {
                    defer.reject(httpResponse);
                } else {
                    tl.debug(body.result);
                    let response: T = <T>(body.result);
                    if (response) {
                        defer.resolve(response);
                    } else {
                        let parsed: any = JSON.parse(body);
                        response = <T>(parsed.result);
                        defer.resolve(response);
                    }
                }
            };

            let headers = this._getHeaders();

            if (this.isBasicAuth()) {
                fs.createReadStream(options.filePath).pipe(request(url, {
                    auth: {
                        username: thisClient.configuration.serviceNowConnection.userAccount,
                        password: thisClient.configuration.serviceNowConnection.userPassword
                    },
                    headers: headers,
                    method: "POST",
                    strictSSL: false,
                }, callback));
            } else {
                fs.createReadStream(options.filePath).pipe(request(url, {
                    headers: headers,
                    method: "POST"
                }, callback));
            }
        }
        return defer.promise;
    }

    private async _updateRecord<T extends models.helsinki.ISystemRecord>(record: T): Promise<T> {
        let url = this.configuration.serviceNowConnection.serverEndpointUrl + this.tableUrl + this.configuration.table;
        url += "/" + record.sys_id;

        let result: T = await this._performHttpAction<T>(url, 200, "PUT", record);
        return result;
    }

    private _performHttpAction<T>(url: string, successCode?: number, method?: string, jsonData?: any): Q.Promise<T> {
        if (!successCode) {
            successCode = 200;
        }
        if (!method) {
            method = "GET";
        }
        if (!jsonData) {
            jsonData = null;
        }
        let defer: Q.Deferred<T> = Q.defer<T>();
        let thisClient: ServiceNowProvider = this;

        if (!this.isBasicAuth() && !this.accessToken) {
            defer.reject("Not authenticated");
        } else {
            let callback: request.RequestCallback = function (err, httpResponse, body) {
                if (err) {
                    defer.reject(err);
                } else if (httpResponse.statusCode !== successCode) {
                    defer.reject(httpResponse);
                } else {
                    tl.debug(body.result);
                    let response: T = <T>(body.result);
                    if (response) {
                        defer.resolve(response);
                    } else {
                        let parsed: any = JSON.parse(body);
                        response = <T>(parsed.result);
                        defer.resolve(response);
                    }
                }
            };

            let headers = this._getHeaders();
            if (this.isBasicAuth()) {
                request(url, {
                    auth: {
                        username: thisClient.configuration.serviceNowConnection.userAccount,
                        password: thisClient.configuration.serviceNowConnection.userPassword
                    },
                    headers: headers,
                    method: method,
                    json: jsonData,
                    strictSSL: false,
                }, callback);
            } else {
                request(url, {
                    headers: headers,
                    method: method,
                    json: jsonData
                }, callback);
            }
        }
        return defer.promise;
    }

    private _getHeaders(): request.Headers {
        let header: request.Headers = null;
        if (this.isBasicAuth()) {
            header = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            };
        } else {
            header = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this.accessToken
            };
        }
        return header;
    }

    queryTable<T>(tableName: string): Q.Promise<T> {
        let defer: Q.Deferred<T> = Q.defer<T>();
        let thisClient: ServiceNowProvider = this;

        if (!this.isBasicAuth() && !this.accessToken) {
            defer.reject("Not authenticated");
        } else {
            let url = thisClient.configuration.serviceNowConnection.serverEndpointUrl + thisClient.tableUrl + tableName;
            let callback: request.RequestCallback = function (err, httpResponse, body) {
                if (err) {
                    defer.reject(err);
                } else if (httpResponse.statusCode !== 200) {
                    defer.reject(httpResponse);
                } else {
                    let response: T = JSON.parse(body);
                    defer.resolve(response);
                }
            };
            let basicHeaders: request.Headers = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            };
            let oauthHeaders: request.Headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this.accessToken
            };

            if (this.isBasicAuth()) {
                request.get(url, {
                    auth: {
                        username: thisClient.configuration.serviceNowConnection.userAccount,
                        password: thisClient.configuration.serviceNowConnection.userPassword
                    },
                    strictSSL: false,
                    headers: basicHeaders
                }, callback);
            } else {
                request.get(url, {
                    headers: oauthHeaders,
                    strictSSL: false,
                }, callback);
            }
        }

        return defer.promise;
    }

    public getItemLocation(sys_id: string): string {
        let url = this.configuration.serviceNowConnection.serverEndpointUrl + "nav_to.do?uri=%2F" + this.configuration.table + ".do%3Fsys_id%3D" + sys_id + "%26sysparm_record_target%3D" + this.configuration.table;
        return url;
    }

    private isBasicAuth(): boolean {
        return this.configuration.serviceNowConnection.mode === models.ServiceNowAuthenticationMode.basic;
    }
}