/// <reference path="../typings/index.d.ts" />

import tl = require("vsts-task-lib/task");
import { TaskOptions, Constants } from "./models";

export class ValidateStateTaskModels extends TaskOptions {
    desiredState: string;
    recordNumber: string;

    constructor() {
        tl.debug("Loading base settings");
        super();
        tl.debug("Loaded base settings");
        this.desiredState = tl.getInput("desiredState", true).trim();
        tl.debug("Loaded desired state: " + this.desiredState);
        this.recordNumber = tl.getInput("recordNumber", true);
        tl.debug("Loaded record number: " + this.recordNumber);
        tl.debug("Finished loading options");
    }
}