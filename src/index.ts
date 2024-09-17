import { LoRaBandwidth, LoRaCodingRate, LoRaSpreadingFactor } from "./constant";
import { LpLoraDriver } from "./driver";
import { UartRadioFreqCfgPacket, UartRadioLoRaCfgPacket, UartRadioPhyCfgPacket, UartRadioRxPacket } from "./packet";
import fs from "fs";

const port = process.env["LPLORA_PORT"] || "/dev/tty.usbmodem314402";
// const port = process.env["LPLORA_PORT"] || "/dev/tty.wchusbserial3110";

const device = new LpLoraDriver(port);
await device.sendPacket(new UartRadioPhyCfgPacket());

const loraCfg = new UartRadioLoRaCfgPacket();
loraCfg.payloadLen = 24;
loraCfg.preambleLen = 32;
loraCfg.enableCRC = true;
loraCfg.invertIQ = false;
loraCfg.fixedHeader = false;
loraCfg.spreadFactor = LoRaSpreadingFactor.Sf12;
loraCfg.codingRate = LoRaCodingRate.Cr45;
loraCfg.bandwidth = LoRaBandwidth.Bw125;
await device.sendPacket(loraCfg);

const freqCfg = new UartRadioFreqCfgPacket();
freqCfg.frequencyHz = 926000000;
await device.sendPacket(freqCfg);

setInterval(async () => {
  const rxReq = new UartRadioRxPacket();
  await device.sendPacket(rxReq);
}, 11000);

device.on("rawDataReceived", (data) => {
  console.log(`Raw: ${data.toString("hex")}`);
});

device.on("packetReceived", (data) => {
  console.log(`Packet: ${JSON.stringify(data)}`);
  fs.appendFile("packet.log", `${new Date().toString()},${JSON.stringify(data)}`, (err) => {
    console.error(err);
  });
});
