import { createSignal, Show } from "solid-js";
import { listen } from '@tauri-apps/api/event';

import "./DeviceSelector.css";

listen('device-found', (event) => {
    console.log(event.payload);
});

export function DeviceSelector(props) {
    return (
        <p>heya</p>
    );
}