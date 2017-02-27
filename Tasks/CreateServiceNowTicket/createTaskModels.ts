/// <reference path="../typings/index.d.ts" />

import tl = require("vsts-task-lib/task");
import { TaskOptions, Constants } from "./models";

export interface IChangeOptions {
    shortDescription: string;
}

export interface IIncidentOptions {
    shortDescription: string;
    urgency: string;
    impact: string;
}

export class CreateTaskOptions extends TaskOptions {
    incidentOptions: IIncidentOptions;
    changeOptions: IChangeOptions;
    shouldStoreRecord: boolean;
    recordVariable: string;
    useGenericData: boolean;
    jsonRepresentation: string;

    constructor() {
        tl.debug("Loading base settings");
        super();
        tl.debug("Loaded base settings");
        if (this.table === Constants.ChangeRequestTable) {
            this._initializeChangeOptions();
        } else if (this.table === Constants.IncidentTable) {
            this._initializeInidentOptions();
        }
        tl.debug("Getting whether or not to use generic data");
        let useGeneric = tl.getInput("useGenericData");
        if (useGeneric === Constants.True) {
            tl.debug("Getting json data");
            this.useGenericData = true;
            this.jsonRepresentation = tl.getInput("jsonRepresentation", true);
            tl.debug("Loaded json data: " + this.jsonRepresentation);
        } else {
            tl.debug("Skipping storing json data");
            this.useGenericData = false;
        }

        tl.debug("Getting storage information");
        let storeResult = tl.getInput("storeResult");
        if (storeResult === Constants.True) {
            tl.debug("Getting variable to store results in");
            this.shouldStoreRecord = true;
            this.recordVariable = tl.getInput("storeVariable", true);
            tl.debug("Loaded variable to store results: " + this.recordVariable);
        } else {
            tl.debug("Skipping storing variable");
            this.shouldStoreRecord = false;
        }
        tl.debug("Finished loading options");
    }

    private _initializeChangeOptions() {
        tl.debug("Getting change request information");
        let shortDescription = tl.getInput("description", false);
        this.changeOptions = {
            shortDescription: shortDescription
        };
        tl.debug("Loaded change request information");
    }

    private _initializeInidentOptions() {
        tl.debug("Getting change request information");
        let shortDescription = tl.getInput("description", false);
        let urgency = tl.getInput("urgency", false);
        let impact = tl.getInput("impact", false);
        this.incidentOptions = {
            shortDescription: shortDescription,
            urgency: urgency,
            impact: impact
        };
        tl.debug("Loaded incident information");
    }
} 