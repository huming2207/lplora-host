import { LoRaBandwidth, LoRaCodingRate, LoRaSpreadingFactor } from "./constant";
import { LpLoraDriver } from "./driver";
import {
  UartPingPacket,
  UartRadioFreqCfgPacket,
  UartRadioLoRaCfgPacket,
  UartRadioPhyCfgPacket,
  UartRadioRxPacket,
} from "./packet";
import fs from "fs";

const port = process.env["LPLORA_PORT"] || "/dev/tty.usbmodem314402";
// const port = process.env["LPLORA_PORT"] || "/dev/tty.wchusbserial3110";

const device = new LpLoraDriver(port);
await device.sendPacket(new UartRadioPhyCfgPacket());

const ping = new UartPingPacket();
device.sendPacket(ping);

const loraCfg = new UartRadioLoRaCfgPacket();
loraCfg.payloadLen = 24;
loraCfg.preambleLen = 8;
loraCfg.enableCRC = true;
loraCfg.invertIQ = false;
loraCfg.fixedHeader = false;
loraCfg.spreadFactor = LoRaSpreadingFactor.Sf12;
loraCfg.codingRate = LoRaCodingRate.Cr45;
loraCfg.bandwidth = LoRaBandwidth.Bw125;
loraCfg.syncWord = Buffer.from([0x24, 0x34]);
await device.sendPacket(loraCfg);

const freqCfg = new UartRadioFreqCfgPacket();
freqCfg.frequencyHz = 926000000;
await device.sendPacket(freqCfg);

device.sendPacket(ping);

setInterval(async () => {
  const rxReq = new UartRadioRxPacket();
  rxReq.timeoutMillisec = 350000;
  await device.sendPacket(rxReq);
}, 35000);

device.on("rawDataReceived", (data) => {
  console.log(`Raw: ${data.toString("hex")}`);
});

device.on("packetReceived", (data) => {
  console.log(`Packet: ${JSON.stringify(data)}`);
  fs.appendFile("packet.log", `${new Date().toString()},${JSON.stringify(data)}\r\n`, (err) => {
    console.error(err);
  });
});
