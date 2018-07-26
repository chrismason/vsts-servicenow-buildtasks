import tl = require("vsts-task-lib/task");

import * as models from "./serviceNowModels";

export function getValidationConfiguration() {
    const configuration: models.IValidateTicketConfiguration = {} as models.IValidateTicketConfiguration;
    getBaseInformation(configuration);
    if (configuration.isLocalDevelopment) {
        getLocalDevServiceNowConfiguration(configuration);
    } else {
        getServiceNowConfiguration(configuration);
    }
    getTFSConfiguration(configuration);

    configuration.desiredState = tl.getInput("desiredState", true);
    configuration.recordNumber = tl.getInput("recordNumber", true);

    return configuration;
}

export function getUpdateTicketConfiguration() {
    const configuration = {} as models.IUpdateTicketConfiguration;
    getBaseInformation(configuration);
    getServiceNowConfiguration(configuration);
    getTFSConfiguration(configuration);

    configuration.recordNumber = tl.getInput("recordNumber", true);
    let useGeneric = tl.getBoolInput("useGenericData");
    if (useGeneric) {
        configuration.useGenericData = true;
        configuration.jsonRepresentation = tl.getInput("jsonRepresentation", true);
    } else {
        configuration.useGenericData = false;
    }

    configuration.updatedDescription = tl.getInput("description", false);
    let attachResult = tl.getBoolInput("uploadAttachment");
    if (attachResult) {
        configuration.uploadAttachment = true;
        configuration.attachmentFile = tl.getInput("attachmentFile", true);
    } else {
        configuration.uploadAttachment = false;
    }

    return configuration;
}

export function getCreateTicketConfiguration() {
    const configuration = {} as models.ICreateTicketConfiguration;

    getBaseInformation(configuration);
    getServiceNowConfiguration(configuration);
    getTFSConfiguration(configuration);

    configuration.table = models.ServiceNowConstants.ChangeRequestTable;

    let useGeneric = tl.getBoolInput("useGenericData");
    if (useGeneric) {
        configuration.useGenericData = true;
        configuration.jsonRepresentation = tl.getInput("jsonRepresentation", true);
    } else {
        configuration.useGenericData = false;
    }

    configuration.description = tl.getInput("description", false);

    configuration.storeResult = tl.getBoolInput("storeResult", true);
    if (configuration.storeResult) {
        tl.getInput("storeVariable", true);
    }

    return configuration;
}

function getBaseInformation(configuration: models.IServiceNowConfiguration) {
    configuration.table = tl.getInput("tableName", false);
    configuration.isLocalDevelopment = tl.getBoolInput("localDevelopment");
}

function getServiceNowConfiguration(configuration: models.IServiceNowConfiguration) {
    const serviceNowConfiguration = {} as models.IServiceNowConnectionConfiguration;
    serviceNowConfiguration.mode = models.ServiceNowAuthenticationMode[tl.getInput("authenticationType")];

    let serverEndpoint = "";
    let serverEndpointUrl = "";
    let clientId = "";
    let clientSecret = "";
    let serverEndpointAuth: tl.EndpointAuthorization = null;
    let userAccount = "";
    let userPassword = "";

    if (serviceNowConfiguration.mode === models.ServiceNowAuthenticationMode.basic) {
        serverEndpoint = tl.getInput("serviceNowBasicEndPoint", true);
    } else {
        serverEndpoint = tl.getInput("serviceNowOAuthEndPoint", true);
    }
    serverEndpointUrl = fixUrl(tl.getEndpointUrl(serverEndpoint, false), "/");
    serverEndpointAuth = tl.getEndpointAuthorization(serverEndpoint, false);

    if (serviceNowConfiguration.mode === models.ServiceNowAuthenticationMode.oauth) {
        clientId = serverEndpointAuth["parameters"]["clientKey"];
        clientSecret = serverEndpointAuth["parameters"]["clientSecret"];
    }
    userAccount = serverEndpointAuth["parameters"]["username"];
    userPassword = serverEndpointAuth["parameters"]["password"];
    serviceNowConfiguration.serverEndpointUrl = serverEndpointUrl;
    serviceNowConfiguration.clientId = clientId;
    serviceNowConfiguration.clientSecret = clientSecret;
    serviceNowConfiguration.userAccount = userAccount;
    serviceNowConfiguration.userPassword = userPassword;
    configuration.serviceNowConnection = serviceNowConfiguration;
}

function getLocalDevServiceNowConfiguration(configuration: models.IServiceNowConfiguration) {
    const serviceNowConfiguration = {} as models.IServiceNowConnectionConfiguration;
    serviceNowConfiguration.mode = models.ServiceNowAuthenticationMode[tl.getInput("authenticationType")];

    serviceNowConfiguration.serverEndpointUrl = fixUrl(tl.getInput("serviceNowUrl", false), "/");
    serviceNowConfiguration.userAccount = tl.getInput("userAccount");
    serviceNowConfiguration.userPassword = tl.getInput("userPassword");

    if (serviceNowConfiguration.mode === models.ServiceNowAuthenticationMode.oauth) {
        serviceNowConfiguration.clientId = tl.getInput("serviceNowClientID", false);
        serviceNowConfiguration.clientSecret = tl.getInput("serviceNowClientSecret", false);
    }
    configuration.serviceNowConnection = serviceNowConfiguration;
}

function getTFSConfiguration(configuration: models.IServiceNowConfiguration) {
    const tfsConfiguration = {} as models.ITFSConfiguration;
    if (!configuration.isLocalDevelopment) {
        tfsConfiguration.rmUri = tl.getVariable("System.TeamFoundationServerUri");
        tfsConfiguration.teamProject = tl.getVariable("System.TeamProject");
        tfsConfiguration.token = tl.getEndpointAuthorizationParameter("SYSTEMVSSCONNECTION", "ACCESSTOKEN", false);
        tfsConfiguration.releaseId = Number(tl.getVariable("Release.ReleaseId"));
        tfsConfiguration.teamProjectId = tl.getVariable("System.TeamProjectId");
    } else {
        tfsConfiguration.token = tl.getInput("DevToken");
        tfsConfiguration.rmUri = tl.getInput("DevURI");
        tfsConfiguration.teamProject = tl.getInput("DevTeamProject");
        tfsConfiguration.teamProjectId = tl.getInput("DevProjectId");
        tfsConfiguration.releaseId = Number(tl.getInput("DevReleaseID"));
    }
    configuration.tfsConfiguration = tfsConfiguration;
}

function fixUrl(value: string, endsWith: string): string {
    let result: string = value.trim();
    if (!result.endsWith(endsWith)) {
        result = result + endsWith;
    }
    return result;
}