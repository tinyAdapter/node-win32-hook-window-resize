"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ffi = require("ffi");
var ref = require("ref");
var StructType = require("ref-struct");
var PID = parseInt(process.argv[2]);
var RECT = StructType({
    left: ref.types.long,
    top: ref.types.long,
    right: ref.types.long,
    bottom: ref.types.long
});
var HANDLEDATA = StructType({
    pid: ref.types.ulong,
    handle: "pointer"
});
var POINT = StructType({
    x: ref.types.long,
    y: ref.types.long
});
var MSG = StructType({
    hwnd: ref.types.uint32,
    message: ref.types.uint,
    wParam: ref.types.uint32,
    lParam: ref.types.uint32,
    time: ref.types.uint32,
    pt: POINT,
    lPrivate: ref.types.uint32
});
var msg = new MSG();
var rect = new RECT();
var pid = ref.alloc(ref.types.ulong);
var rectPtr = ref.refType(RECT);
var msgPtr = ref.refType(MSG);
var handleDataPtr = ref.refType(HANDLEDATA);
var WINEVENT_OUTOFCONTEXT = 0;
var EVENT_OBJECT_LOCATIONCHANGE = 0x800b;
var user32 = ffi.Library("user32", {
    SetWinEventHook: [
        "int",
        ["int", "int", "pointer", "pointer", "int", "int", "int"]
    ],
    GetWindowRect: ["bool", ["pointer", rectPtr]],
    GetMessageW: ["bool", [msgPtr, "int", "uint", "uint"]],
    TranslateMessageEx: ["int", [msgPtr]],
    DispatchMessageW: ["long", [msgPtr]],
    EnumWindows: ["bool", ["pointer", "uint"]],
    GetWindowThreadProcessId: ["ulong", ["pointer", "pointer"]],
    GetWindow: ["pointer", ["pointer", "uint"]],
    IsWindowVisible: ["bool", ["pointer"]]
});
var pfnWinEventProc = ffi.Callback("void", ["pointer", "int", "pointer", "long", "long", "int", "int"], function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {
    if (!ref.address(hwnd) ||
        !isMainWindow(hwnd) ||
        event !== EVENT_OBJECT_LOCATIONCHANGE)
        return;
    user32.GetWindowThreadProcessId(hwnd, pid);
    user32.GetWindowRect(hwnd, rect.ref());
    sendToParent({
        pid: ref.get(pid),
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
    });
});
user32.SetWinEventHook(EVENT_OBJECT_LOCATIONCHANGE, EVENT_OBJECT_LOCATIONCHANGE, null, pfnWinEventProc, PID, 0, WINEVENT_OUTOFCONTEXT);
var pfnEnumWindowsCallback = ffi.Callback("bool", ["pointer", handleDataPtr], function (handle, lParam) {
    user32.GetWindowThreadProcessId(handle, pid);
    if (PID !== ref.get(pid) || !isMainWindow(handle)) {
        return true;
    }
    user32.GetWindowRect(handle, rect.ref());
    sendToParent({
        pid: ref.get(pid),
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
    });
    return true;
});
user32.EnumWindows(pfnEnumWindowsCallback, 0);
while (user32.GetMessageW(msg.ref(), null, 0, 0)) {
    user32.TranslateMessageEx(msg.ref());
    user32.DispatchMessageW(msg.ref());
}
function isMainWindow(handle) {
    return user32.IsWindowVisible(handle);
}
function sendToParent(rect) {
    if (!process.send)
        throw new Error("not child process");
    process.send(rect);
}
