import { WindowRect } from "./worker";
import { EventEmitter } from "events";
export interface ResizeMonitor {
    /**
     * Specifiy callback function when the specific window(s) resizes/moves
     *
     * @param event Must be "resize"
     * @param listener The callback function
     */
    on(event: "resize", listener: (rect: WindowRect) => void): this;
}
export declare class ResizeMonitor extends EventEmitter {
    private childProcess;
    /**
     * Notify when any window resizes/moves, based on Win32 APIs.
     *
     * NOTE: Process ID can be specified to zero, under which the hooker monitors
     * ALL window resizing, which can be a huge decrease of system performance.
     *
     * @param pid Process ID
     */
    constructor(pid: number);
    /**
     * Kill the worker process, stops monitoring
     */
    kill(): void;
}
