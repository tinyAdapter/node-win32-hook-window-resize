const ResizeMonitor = require("../lib").ResizeMonitor;

const wh = new ResizeMonitor(parseInt(process.argv[2]));

wh.on("resize", rect => {
  console.log(rect);
});
