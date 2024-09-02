import { LpLoraDriver } from "./driver";
import { UartRadioFreqCfgPacket, UartRadioLoRaCfgPacket, UartRadioPhyCfgPacket, UartRadioTxPacket } from "./packet";

const port = process.env["LPLORA_PORT"] || "/dev/tty.wchusbserial31440";

const device = new LpLoraDriver(port);
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

setInterval(async () => {
  const txReq = new UartRadioTxPacket();
  txReq.payload = Buffer.from([0xca, 0xfe, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef]);
  await device.sendPacket(txReq);
}, 500);

device.on("rawDataReceived", (data) => {
  console.log(`Raw: ${data.toString("hex")}`);
});

device.on("packetReceived", (data) => {
  console.log(`Packet: ${JSON.stringify(data)}`);
});
