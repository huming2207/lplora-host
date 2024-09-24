import { LpLoraDriver } from "./driver";
import { UartRadioReceivedPacket, UartRadioRxPacket } from "./packet";
import fs from "fs";
import { crc32mpeg2 } from "crc";

const port = process.env["LPLORA_PORT"] || "/dev/tty.usbmodem314402";
// const port = process.env["LPLORA_PORT"] || "/dev/tty.wchusbserial3110";

const device = new LpLoraDriver(port);

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
  const packet = data as UartRadioReceivedPacket;
  if (Buffer.isBuffer(packet.receivedData)) {
    const eolFlag = packet.receivedData[15];
    const counter = packet.receivedData.readUInt32LE(packet.receivedData.length - 8);
    const expectedCrc = packet.receivedData.readUInt32LE(packet.receivedData.length - 4);
    const sub = Buffer.from(packet.receivedData.subarray(0, packet.receivedData.length - 4));
    const actualCrc = crc32mpeg2(sub);

    const crcOk = actualCrc === expectedCrc;

    fs.appendFile(
      "packet.log",
      `'${new Date().getTime()}','${counter}','CRC32 ${crcOk ? "OK" : "FAIL"}','${eolFlag}','${JSON.stringify(data)}'\r\n`,
      (err) => {
        console.error(err);
      },
    );
  }
});
