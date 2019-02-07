import { ChildProcess, fork } from "child_process";
import { WindowRect } from "./worker";
import { resolve } from "path";
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

export class ResizeMonitor extends EventEmitter {
  private childProcess: ChildProcess;

  /**
   * Notify when any window resizes/moves, based on Win32 APIs.
   *
   * NOTE: Process ID can be specified to zero, under which the hooker monitors
   * ALL window resizing, which can be a huge decrease of system performance.
   *
   * @param pid Process ID
   *
   * @throws _RangeError_ if process id is invalid
   */
  constructor(pid: number) {
    super();
    if (pid < 0 || pid > 65535) throw new RangeError("invalid process id");

    this.childProcess = fork(resolve(__dirname, "worker.js"), [pid.toString()]);
    this.childProcess.on("message", (rect: WindowRect) => {
      this.emit("resize", rect);
    });
  }

  /**
   * Kill the worker process, stops monitoring
   */
  kill() {
    if (this.childProcess) this.childProcess.kill();
  }
}
