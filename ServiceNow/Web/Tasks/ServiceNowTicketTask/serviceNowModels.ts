import tl = require("vsts-task-lib/task");

export interface IAuthentication {
    scope: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    access_token: string;
}

export interface IAttachmentOptions {
    id?: string;
    fileName?: string;
    recordNumber?: string;
    filePath: string;
}

export enum ServiceNowAction {
    create,
    update,
    validate
}

export interface IServiceNowConfiguration {
    table: string;
    serviceNowConnection: IServiceNowConnectionConfiguration;
    tfsConfiguration: ITFSConfiguration;
    isLocalDevelopment: boolean;
}

export interface ITFSConfiguration {
    token: string;
    rmUri: string;
    teamProject: string;
    teamProjectId: string;
    releaseId: number;
}

export enum ServiceNowAuthenticationMode {
    basic,
    oauth
}

export interface IServiceNowConnectionConfiguration {
    mode: ServiceNowAuthenticationMode;
    userAccount?: string;
    userPassword?: string;
    serverEndpointUrl: string;
    clientId?: string;
    clientSecret?: string;
}

export interface IAuthentication {
    scope: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    access_token: string;
}

export interface IServiceNowAttachment {
    tableName: string;
    ticketNumber: string;
    url: string;
}

export interface TaskAttachment {
    _links: any;
    createdOn: Date;
    lastChangedBy: string;
    lastChangedOn: Date;
    name: string;
    recordId: string;
    timelineId: string;
    type: string;
}

export interface IValidateTicketConfiguration extends IServiceNowConfiguration {
    desiredState: string;
    recordNumber?: string;
}

export interface IUpdateTicketConfiguration extends IServiceNowConfiguration {
    recordNumber?: string;
    useGenericData: boolean;
    jsonRepresentation?: string;
    updatedDescription?: string;
    uploadAttachment: boolean;
    attachmentFile?: string;
}

export interface ICreateTicketConfiguration extends IServiceNowConfiguration {
    recordNumber?: string;
    useGenericData: boolean;
    jsonRepresentation?: string;
    description?: string;
    storeResult: boolean;
    storeVariable?: string;
}

export class ServiceNowConstants {
    public static ChangeRequestTable: string = "change_request";
    public static IncidentTable: string = "incident";
    public static UserTable: string = "sys_user";
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