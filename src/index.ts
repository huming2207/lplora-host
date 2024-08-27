import { LpLoraDriver } from "./driver";
import { UartRadioFreqCfgPacket, UartRadioLoRaCfgPacket, UartRadioPhyCfgPacket } from "./packet";

const device = new LpLoraDriver("/dev/tty.wchusbserial31440");
await device.sendPing();

await device.sendPing();
await device.sendPing();
await device.sendPing();

await device.sendPing();

await device.sendPacket(new UartRadioPhyCfgPacket());

const loraCfg = new UartRadioLoRaCfgPacket();
loraCfg.payloadLen = 10;
loraCfg.preambleLen = 10;
await device.sendPacket(loraCfg);

const freqCfg = new UartRadioFreqCfgPacket();
freqCfg.frequencyHz = 919000000;
await device.sendPacket(freqCfg);

device.on("rawDataReceived", (data) => {
  console.log(`Raw: ${data.toString("hex")}`);
});

device.on("packetReceived", (data) => {
  console.log(`Packet: ${JSON.stringify(data)}`);
});
