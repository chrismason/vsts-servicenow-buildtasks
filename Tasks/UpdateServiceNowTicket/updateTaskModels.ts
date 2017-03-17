import tl = require("vsts-task-lib/task");
import { TaskOptions, Constants } from "./models";

export class UpdateTaskModels extends TaskOptions {
    recordNumber: string;
    uploadAttachment: boolean;
    attachmentFile: string;
    updatedDescription: string;
    useGenericData: boolean;
    jsonRepresentation: string;

    constructor() {
        tl.debug("Loading base settings");
        super();
        tl.debug("Loaded base settings");
        this.recordNumber = tl.getInput("recordNumber", true);
        tl.debug("Loaded record number: " + this.recordNumber);

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

        this.updatedDescription = tl.getInput("description", false);
        tl.debug("Loaded description: " + this.updatedDescription);
        let attachResult = tl.getInput("uploadAttachment");
        if (attachResult === Constants.True) {
            tl.debug("Loading attachments");
            this.uploadAttachment = true;
            this.attachmentFile = tl.getInput("attachmentFile", true);
            tl.debug("Loaded attachments: " + this.attachmentFile);
        } else {
            tl.debug("Skipping attachment");
            this.uploadAttachment = false;
        }
        tl.debug("Finished loading options");
    }
}