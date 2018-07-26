import * as React from "react";

abstract class BaseComponent<P, S> extends React.Component<P, S> {
    render(): React.ReactElement<{}> {
        let result: React.ReactElement<{}>;
        try {
            result = this.doRender();
        } catch (error) {
            this.logError(error);
            result = null;
        }

        return result;
    }

    abstract doRender(): React.ReactElement<{}>;

    logError(error: Error): void {
        /* tslint:disable */
        const componentName: string = (this as any)._reactInternalInstance._currentElement.type.name;
        const componentDetail: string = (this as any)._reactInternalInstance._currentElement.type.toString();
        let propsString = "";
        for (let propName in this.props) {
            propsString += " " + propName;
        }

        console.error(error, { Component: componentName, ComponentDetail: componentDetail, PropList: propsString });
        console.error("A component (" + componentName + ") had an error during render.");
        /* tslint:enable */
    }
}

export default BaseComponent;