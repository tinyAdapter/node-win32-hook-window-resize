"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var path_1 = require("path");
var events_1 = require("events");
var ResizeMonitor = /** @class */ (function (_super) {
    __extends(ResizeMonitor, _super);
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
    function ResizeMonitor(pid) {
        var _this = _super.call(this) || this;
        if (pid < 0 || pid > 65535)
            throw new RangeError("invalid process id");
        _this.childProcess = child_process_1.fork(path_1.resolve(__dirname, "worker.js"), [pid.toString()]);
        _this.childProcess.on("message", function (rect) {
            _this.emit("resize", rect);
        });
        return _this;
    }
    /**
     * Kill the worker process, stops monitoring
     */
    ResizeMonitor.prototype.kill = function () {
        if (this.childProcess)
            this.childProcess.kill();
    };
    return ResizeMonitor;
}(events_1.EventEmitter));
exports.ResizeMonitor = ResizeMonitor;
