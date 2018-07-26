import * as React from "react";
import BaseComponent from "../BaseComponent";
import { MessageBar, MessageBarType } from "office-ui-fabric-react/lib-amd/MessageBar";

export class NoData extends BaseComponent<{}, {}> {
    doRender(): React.ReactElement<{}> {
        return (
            <MessageBar>No ServiceNow tasks have been configured for this release definition.</MessageBar>
        );
    }
}