# node-win32-hook-window-resize

Notify when any window resizes/moves, based on Win32 APIs.

## Example

```js
const ResizeMonitor = require("win32-hook-window-resize").ResizeMonitor;

const wh = new ResizeMonitor(parseInt(process.argv[2]));

wh.on("resize", rect => {
  console.log(rect);
});
```

## API

### ResizeMonitor(pid: number)

The constructor.

#### Params

- `pid` - Process ID

#### Throws

- _RangeError_ if process id is invalid

#### Note

Process ID can be specified to zero, under which the hooker monitors
ALL window resizing, which can be a huge decrease of system performance.

### kill(): void

Kill the worker process, stops monitoring.

### on(event: "resize", listener: (rect: WindowRect) => void): this

Specify callback function when the specific window(s) resizes/moves.

#### Params

- `event` - Must be "resize"
- `listener` - The callback function

#### WindowRect

```ts
{
  pid: number; // process ID
  left: number; // left border position
  top: number; // top border position
  right: number; // right border position
  bottom: number; // bottom border position
}
```

## License

MIT
