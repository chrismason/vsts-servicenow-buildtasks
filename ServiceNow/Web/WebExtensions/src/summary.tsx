/// <reference types="vss-web-extension-sdk" />

import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./Components/App/App";

function initializeUI(containerId: string) {
    ReactDOM.render((
        <App />
    ), document.getElementById(containerId));
}

export function initialize(containerId: string) {
    initializeUI(containerId);
}