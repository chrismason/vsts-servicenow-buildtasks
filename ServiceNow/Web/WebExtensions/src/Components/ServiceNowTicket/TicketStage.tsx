import * as React from "react";
import BaseComponent from "../BaseComponent";
import { ITicketStage, StageStatus } from "../../Models/ServiceNow";

import "./TicketStage.scss";

export interface ITicketStageProps {
    stage: ITicketStage;
}

export class TicketStage extends BaseComponent<ITicketStageProps, {}> {
    doRender(): React.ReactElement<{}> {
        let cssState = "notstarted";
        switch (this.props.stage.status) {
            case StageStatus.Complete: {
                cssState = "complete";
                break;
            }
            case StageStatus.InProgress: {
                cssState = "inprogress";
                break;
            }
            case StageStatus.Rejected: {
                cssState = "rejected";
                break;
            }
        }
        return (
            <div className={"stageTile " + cssState} title={this.props.stage.stageName}>
            </div>
        );
    }
}