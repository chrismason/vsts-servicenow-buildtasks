import * as React from "react";
import BaseComponent from "../BaseComponent";
import { NoData } from "../NoData/NoTasks";
import { Error } from "../Error/Error";
import { VSTSConfigurationProvider } from "../../DataLayer/VSTSProvider";
import { ServiceNowProvider } from "../../DataLayer/ServiceNowProvider";
import { ServiceNowTicket } from "../ServiceNowTicket/ServiceNowTicket";
import { ICreatedTicket, ITicketStatus } from "../../Models/ServiceNow";
import { Spinner, SpinnerType } from "office-ui-fabric-react/lib-amd/Spinner";

export interface IAppState {
    isInError?: boolean;
    isLoadComplete: boolean;
    errorMessage?: string;
    tickets: ITicketsState;
}

export interface ITicketsState {
    availableTickets: ICreatedTicket[];
    loadedTickets: ITicketStatus[];
}

export class App extends BaseComponent<{}, IAppState> {
    constructor() {
        super();
        this.state = this.getInitialState();
        this.setState(this.state);
    }

    componentDidMount(): void {
        let provider = new VSTSConfigurationProvider();
        provider.getCreatedTickets().then(tickets => {
            this.state.tickets.availableTickets = tickets;
            let snowProvider = new ServiceNowProvider();
            snowProvider.getTicketDetails(tickets).then(resolvedTickets => {
                let newState = { ...this.state };
                newState.tickets.loadedTickets = resolvedTickets;
                newState.isLoadComplete = true;
                this.setState(newState);
            }, error => {
                let newState = { ...this.state };
                newState.isLoadComplete = true;
                newState.isInError = true;
                newState.errorMessage = error.message;
                this.setState(newState);
            });
            this.setState(this.state);
        }, error => {
            let newState = { ...this.state };
            newState.isLoadComplete = true;
            newState.isInError = true;
            newState.errorMessage = error;
            this.setState(this.state);
        });
    }

    doRender(): React.ReactElement<{}> {
        let content: React.ReactElement<{}>;
        if (!this.state.isLoadComplete) {
            content = (
                <div>
                    <Spinner type={SpinnerType.large} />
                </div>);
        } else if (this.state.isInError) {
            content = <Error errorMessage={this.state.errorMessage} />;
        } else {
            if (this.state.tickets.availableTickets.length === 0) {
                content = <NoData />;
            } else {
                content = <ServiceNowTicket tickets={this.state.tickets.loadedTickets} />;
            }
        }
        return (
            <div>
                {content}
            </div>
        );
    }

    private getInitialState(): IAppState {
        return {
            isLoadComplete: false,
            tickets: {
                availableTickets: [],
                loadedTickets: []
            }
        };
    }
}