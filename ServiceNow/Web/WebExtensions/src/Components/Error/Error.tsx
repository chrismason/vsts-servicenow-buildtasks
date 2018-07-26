import * as React from "react";
import BaseComponent from "../BaseComponent";
import { MessageBar, MessageBarType } from "office-ui-fabric-react/lib-amd/MessageBar";

export interface IErrorProps {
    errorMessage: string;
}

export class Error extends BaseComponent<IErrorProps, {}> {
    doRender(): React.ReactElement<{}> {
        return (
            <div>
                <MessageBar messageBarType={MessageBarType.error}>{this.props.errorMessage}</MessageBar>
            </div>
        );
    }
}