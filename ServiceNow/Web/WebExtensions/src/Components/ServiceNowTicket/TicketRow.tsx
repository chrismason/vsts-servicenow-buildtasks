import * as React from "react";
import BaseComponet from "../BaseComponent";
import { TicketStage } from "./TicketStage";
import { ITicketStatus, ITicketStage } from "../../Models/ServiceNow";
import { Link } from "office-ui-fabric-react/lib-amd/Link";

import "./TicketRow.scss";

export interface ITicketRowProps {
    ticket: ITicketStatus;
}

export class TicketRow extends BaseComponet<ITicketRowProps, {}> {
    doRender(): React.ReactElement<{}> {
        let stages = this.props.ticket.stages && this.props.ticket.stages.length > 0 ?
            this.props.ticket.stages.map((stage, i) => {
                return <TicketStage key={i} stage={stage} />;
            })
            : null;
        return (
            <div className="ticketRow ms-Grid-row">
                <div className="ms-Grid-col ms-u-sm3 ticket-cell">
                    <Link href={this.props.ticket.url} target="_blank">{this.props.ticket.ticketNumber}</Link>
                </div>
                <div className="ticketList ms-Grid-col ms-u-sm9 ticket-cell">
                    {stages}
                </div>
            </div>
        );
    }
}