/// <reference path="../typings/index.d.ts" />

import tl = require("vsts-task-lib/task");

export interface IAuthentication {
    scope: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    access_token: string;
}

export interface IServerOptions {
    serverEndpointUrl: string;
    clientId: string;
    clientSecret: string;
    userAccount: string;
    userPassword: string;
    isBasicAuth: boolean;
}

export interface IAttachmentOptions {
    id?: string;
    fileName?: string;
    recordNumber?: string;
    filePath: string;
}

export class Constants {
    public static ChangeRequestTable: string = "change_request";
    public static IncidentTable: string = "incident";
    public static UserTable: string = "sys_user";

    public static BasicAuth: string = "basic";
    public static OAuth: string = "oauth";

    public static True: string = "true";
    public static False: string = "false";
}

export class TaskOptions {
    serverOptions: IServerOptions;
    table: string;

    constructor() {
        tl.debug("Loading server settings");
        let localDevelopment = tl.getInput("localDevelopment");
        if (localDevelopment === Constants.True) {
            this._initializeDevSettings();
        } else {
            this._initializeServerSettings();
        }
        tl.debug("Loading table");
        this.table = tl.getInput("tableName", false);
        tl.debug("Table loaded: " + this.table);
    }

    public useBasicAuth(): boolean {
        return this.serverOptions.isBasicAuth;
    }

    protected _initializeServerSettings() {
        let isBasicAuth = true;
        tl.debug("Getting authentication type");
        let authType = tl.getInput("authenticationType", true);
        if (authType === Constants.OAuth) {
            isBasicAuth = false;
        } else {
            isBasicAuth = true;
        }

        let serverEndpoint = "";
        let serverEndpointUrl = "";
        let clientId = "";
        let clientSecret = "";
        let serverEndpointAuth: tl.EndpointAuthorization = null;
        let userAccount = "";
        let userPassword = "";

        if (isBasicAuth) {
            tl.debug("Getting basic auth server information");
            serverEndpoint = tl.getInput("serviceNowBasicEndPoint", true);
        } else {
            tl.debug("Getting oauth server information");
            serverEndpoint = tl.getInput("serviceNowOAuthEndPoint", true);
        }
        tl.debug("Getting server endpoint");
        serverEndpointUrl = this.fixUrl(tl.getEndpointUrl(serverEndpoint, false), "/");
        tl.debug("Getting endpoint authorization");
        serverEndpointAuth = tl.getEndpointAuthorization(serverEndpoint, false);

        if (isBasicAuth) {
            tl.debug("Getting basic client information");
            clientId = serverEndpointAuth["parameters"]["clientKey"];
            clientSecret = serverEndpointAuth["parameters"]["clientSecret"];
        }
        tl.debug("Getting user information");
        userAccount = serverEndpointAuth["parameters"]["username"];
        userPassword = serverEndpointAuth["parameters"]["password"];

        this.serverOptions = {
            serverEndpointUrl: serverEndpointUrl,
            clientId: clientId,
            clientSecret: clientSecret,
            isBasicAuth: isBasicAuth,
            userAccount: userAccount,
            userPassword: userPassword,
        };
    }

    protected _initializeDevSettings() {
        let isBasicAuth = true;
        let authType = tl.getInput("authenticationType", true);
        if (authType === Constants.OAuth) {
            isBasicAuth = false;
        } else {
            isBasicAuth = true;
        }

        let serverEndpointUrl = tl.getInput("serviceNowUrl", false);
        let clientId = tl.getInput("serviceNowClientID", false);
        let clientSecret = tl.getInput("serviceNowClientSecret", false);
        let userAccount = tl.getInput("userAccount", false);
        let userPassword = tl.getInput("userPassword", false);

        this.serverOptions = {
            serverEndpointUrl: serverEndpointUrl,
            clientId: clientId,
            clientSecret: clientSecret,
            isBasicAuth: isBasicAuth,
            userAccount: userAccount,
            userPassword: userPassword,
        };
    }

    protected fixUrl(value: string, endsWith: string): string {
        let result: string = value.trim();
        if (!result.endsWith(endsWith)) {
            result = result + endsWith;
        }
        return result;
    }
}

export namespace helsinki {
    export interface ISystemRecord {
        number?: string;
        sys_id?: string;
    }

    export interface ResolvedBy {
        link: string;
        value: string;
    }

    export interface OpenedBy {
        link: string;
        value: string;
    }

    export interface SysDomain {
        link: string;
        value: string;
    }

    export interface CmdbCi {
        link: string;
        value: string;
    }

    export interface CallerId {
        link: string;
        value: string;
    }

    export interface AssignmentGroup {
        link: string;
        value: string;
    }

    export interface ClosedBy {
        link: string;
        value: string;
    }

    export interface ProblemId {
        link: string;
        value: string;
    }

    export interface AssignedTo {
        link: string;
        value: string;
    }

    export interface Location {
        link: string;
        value: string;
    }

    export interface Incident extends ISystemRecord {
        parent?: string;
        made_sla?: string;
        caused_by?: string;
        watch_list?: string;
        upon_reject?: string;
        sys_updated_on?: string;
        child_incidents?: string;
        hold_reason?: string;
        approval_history?: string;
        resolved_by?: ResolvedBy;
        sys_updated_by?: string;
        opened_by?: OpenedBy;
        user_input?: string;
        sys_created_on?: string;
        sys_domain?: SysDomain;
        state?: string;
        sys_created_by?: string;
        knowledge?: string;
        order?: string;
        calendar_stc?: string;
        closed_at?: string;
        cmdb_ci?: CmdbCi;
        impact?: string;
        active?: string;
        work_notes_list?: string;
        business_service?: string;
        priority?: string;
        sys_domain_path?: string;
        rfc?: string;
        time_worked?: string;
        expected_start?: string;
        opened_at?: string;
        business_duration?: string;
        group_list?: string;
        work_end?: string;
        caller_id?: CallerId;
        resolved_at?: string;
        approval_set?: string;
        subcategory?: string;
        work_notes?: string;
        short_description: string;
        close_code?: string;
        correlation_display?: string;
        work_start?: string;
        assignment_group?: AssignmentGroup;
        additional_assignee_list?: string;
        business_stc?: string;
        description?: string;
        calendar_duration?: string;
        close_notes?: string;
        notify?: string;
        sys_class_name?: string;
        closed_by?: ClosedBy;
        follow_up?: string;
        parent_incident?: string;
        contact_type?: string;
        incident_state?: string;
        urgency?: string;
        problem_id?: ProblemId;
        company?: string;
        reassignment_count?: string;
        activity_due?: string;
        assigned_to?: AssignedTo;
        severity?: string;
        comments?: string;
        approval?: string;
        sla_due?: string;
        comments_and_work_notes?: string;
        due_date?: string;
        sys_mod_count?: string;
        reopen_count?: string;
        sys_tags?: string;
        escalation?: string;
        upon_approval?: string;
        correlation_id?: string;
        location?: Location;
        category?: string;
    }

    export interface ChangeRequest {
        link: string;
        value: string;
    }

    export interface ChangeTask extends ISystemRecord {
        created_from?: string;
        upon_approval?: string;
        change_request?: ChangeRequest;
        location?: string;
        expected_start?: string;
        close_notes?: string;
        additional_assignee_list?: string;
        impact?: string;
        urgency?: string;
        correlation_id?: string;
        sys_tags?: string;
        description?: string;
        group_list?: string;
        priority?: string;
        sys_domain?: SysDomain;
        sys_mod_count?: string;
        work_notes_list?: string;
        business_service?: string;
        follow_up?: string;
        closed_at?: string;
        sla_due?: string;
        sys_updated_on?: string;
        parent?: string;
        work_end?: string;
        closed_by?: string;
        work_start?: string;
        business_duration?: string;
        activity_due?: string;
        correlation_display?: string;
        company?: string;
        due_date?: string;
        active?: string;
        assignment_group?: string;
        knowledge?: string;
        made_sla?: string;
        comments_and_work_notes?: string;
        state?: string;
        user_input?: string;
        approval_set?: string;
        sys_created_on?: string;
        reassignment_count?: string;
        opened_at?: string;
        order?: string;
        short_description: string;
        sys_updated_by?: string;
        upon_reject?: string;
        approval_history?: string;
        work_notes?: string;
        calendar_duration?: string;
        approval?: string;
        sys_created_by?: string;
        assigned_to?: AssignedTo;
        cmdb_ci?: CmdbCi;
        sys_domain_path?: string;
        opened_by?: OpenedBy;
        rejection_goto?: string;
        sys_class_name?: string;
        watch_list?: string;
        time_worked?: string;
        contact_type?: string;
        escalation?: string;
        comments?: string;
    }
}