import * as ffi from "ffi";
import * as ref from "ref";
import * as StructType from "ref-struct";

let PID = parseInt(process.argv[2]);

export interface WindowRect {
  /** Process ID */
  pid: number;
  /** The left border position */
  left: number;
  /** The top border position */
  top: number;
  /** The right border position */
  right: number;
  /** The bottom border position */
  bottom: number;
}

let RECT = StructType({
  left: ref.types.long,
  top: ref.types.long,
  right: ref.types.long,
  bottom: ref.types.long
});

let HANDLEDATA = StructType({
  pid: ref.types.ulong,
  handle: "pointer"
});

let POINT = StructType({
  x: ref.types.long,
  y: ref.types.long
});
let MSG = StructType({
  hwnd: ref.types.uint32,
  message: ref.types.uint,
  wParam: ref.types.uint32,
  lParam: ref.types.uint32,
  time: ref.types.uint32,
  pt: POINT,
  lPrivate: ref.types.uint32
});
let msg = new MSG();
let rect = new RECT();
let pid = ref.alloc(ref.types.ulong);

const rectPtr = ref.refType(RECT);
const msgPtr = ref.refType(MSG);
const handleDataPtr = ref.refType(HANDLEDATA);
const WINEVENT_OUTOFCONTEXT = 0;
const EVENT_OBJECT_LOCATIONCHANGE = 0x800b;

const user32 = ffi.Library("user32", {
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

const pfnWinEventProc = ffi.Callback(
  "void",
  ["pointer", "int", "pointer", "long", "long", "int", "int"],
  function(
    hWinEventHook: Buffer,
    event: number,
    hwnd: Buffer,
    idObject: number,
    idChild: number,
    idEventThread: number,
    dwmsEventTime: number
  ) {
    if (
      !ref.address(hwnd) ||
      !isMainWindow(hwnd) ||
      event !== EVENT_OBJECT_LOCATIONCHANGE
    )
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
  }
);

user32.SetWinEventHook(
  EVENT_OBJECT_LOCATIONCHANGE,
  EVENT_OBJECT_LOCATIONCHANGE,
  null,
  pfnWinEventProc,
  PID,
  0,
  WINEVENT_OUTOFCONTEXT
);

const pfnEnumWindowsCallback = ffi.Callback(
  "bool",
  ["pointer", handleDataPtr],
  function(handle: Buffer, lParam: any) {
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
  }
);

user32.EnumWindows(pfnEnumWindowsCallback, 0);

while (user32.GetMessageW(msg.ref(), null, 0, 0)) {
  user32.TranslateMessageEx(msg.ref());
  user32.DispatchMessageW(msg.ref());
}

function isMainWindow(handle: Buffer) {
  return user32.IsWindowVisible(handle);
}

function sendToParent(rect: WindowRect) {
  if (!process.send) throw new Error("not child process");

  process.send(rect);
}
