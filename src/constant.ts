import { UartPacket } from "./packet";

export enum PacketType {
  // Request from host
  Ping = 0x00,
  RadioPhyConfig = 0x10,
  RadioFreqConfig = 0x11,
  RadioLoraConfig = 0x12,
  RadioGfskConfig = 0x13,
  EnterSleepStop2 = 0x20, // Enter STOP2; TBD
  RadioGoSleep = 0x40,
  RadioGoIdle = 0x41,
  RadioSend = 0x42,
  RadioRecvStart = 0x43,

  // Reply from module
  Pong = 0x80,
  Ack = 0x83,
  Nack = 0x84,
  RadioReceivedPacket = 0xc1,
}

export const SLIP_START = 0xa5;
export const SLIP_END = 0xc0;
export const SLIP_ESC = 0xdb;
export const SLIP_ESC_END = 0xdc;
export const SLIP_ESC_ESC = 0xdd;
export const SLIP_ESC_START = 0xde;

export type LpLoraDriverEvents = {
  packetReceived: [packet: UartPacket];
  rawDataReceived: [data: Buffer];
  end: [data: Buffer];
  error: [err: Error | unknown | object];
};
