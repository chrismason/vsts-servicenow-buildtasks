import * as React from "react";
import BaseComponet from "../BaseComponent";
import { ITicketStatus } from "../../Models/ServiceNow";
import { TicketRow } from "./TicketRow";
import { Label } from "office-ui-fabric-react/lib-amd/Label";

export interface ITicketListProps {
    tickets: ITicketStatus[];
}

export class TicketList extends BaseComponet<ITicketListProps, {}> {
    doRender(): React.ReactElement<{}> {
        let ticketRowContent = this.props.tickets && this.props.tickets.length > 0 ?
            this.props.tickets.map((ticket, i) => {
                return <TicketRow key={i} ticket={ticket} />;
            }) :
            null;
        return (
            <div className="ms-Grid">
                {ticketRowContent}
            </div>
        );
    }
}