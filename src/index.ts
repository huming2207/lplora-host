import { LpLoraDriver } from "./driver";

const device = new LpLoraDriver("/dev/tty.wchusbserial31440");
await device.sendPing();

device.on("rawDataReceived", (data) => {
  console.log(`Raw: ${data.toString("hex")}`);
});

device.on("packetReceived", (data) => {
  console.log(`Packet: ${data}`);
});
