import * as React from "react";
import BaseComponent from "../BaseComponent";
import { ITicketStatus } from "../../Models/ServiceNow";
import { TicketList } from "./TicketList";

import "./ServiceNowTicket.scss";

export interface IServiceNowTicketProps {
    tickets?: ITicketStatus[];
}

export class ServiceNowTicket extends BaseComponent<IServiceNowTicketProps, {}> {
    doRender(): React.ReactElement<{}> {
        return (
            <div className="serviceNowSummary">
                <TicketList tickets={this.props.tickets} />
            </div>
        );
    }
}