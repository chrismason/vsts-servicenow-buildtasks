export interface IServiceNowCredentials {
    username: string;
    password: string;
    url: string;
}

export interface ICreatedTicket {
    tableName: string;
    ticketNumber: string;
    url: string;
}

export enum StageStatus {
    NotStarted,
    InProgress,
    Complete,
    Rejected
}

export interface ITicketStage {
    stageName: string;
    status: StageStatus;
}

export interface ITicketStatus {
    ticketNumber: string;
    stages: ITicketStage[];
    url: string;
}