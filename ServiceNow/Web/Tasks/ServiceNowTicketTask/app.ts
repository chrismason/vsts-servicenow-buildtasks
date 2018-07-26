import tl = require("vsts-task-lib/task");
import { ServiceNowAction } from "./serviceNowModels";
import { ValidateState } from "./validateState";
import { UpdateTicket } from "./updateTicket";
import { CreateTicket } from "./createTicket";

async function runTask() {
    let action = ServiceNowAction[tl.getInput("serviceNowAction", true)];
    if (action === ServiceNowAction.validate) {
        let stateAction = new ValidateState();
        await stateAction.validate();
    } else if (action === ServiceNowAction.update) {
        let updateAction = new UpdateTicket();
        await updateAction.updateTicket();
    } else if (action === ServiceNowAction.create) {
        let createAction = new CreateTicket();
        await createAction.createTicket();
    } else {
        tl.setResult(tl.TaskResult.Failed, "Unsupported ServiceNow action");
    }
}

runTask();