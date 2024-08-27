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

export enum RadioPaSelect {
  PA_SELECT_LP = 0,
  PA_SELECT_HP = 1,
}

export enum RadioPaRampTime {
  /// 10µs
  Micros10 = 0x00,
  /// 20µs
  Micros20 = 0x01,
  /// 40µs
  Micros40 = 0x02,
  /// 80µs
  Micros80 = 0x03,
  /// 200µs
  Micros200 = 0x04,
  /// 800µs
  Micros800 = 0x05,
  /// 1.7ms
  Micros1700 = 0x06,
  /// 3.4ms
  Micros3400 = 0x07,
}

export enum LoRaSpreadingFactor {
  /// Spreading factor 5.
  Sf5 = 0x05,
  /// Spreading factor 6.
  Sf6 = 0x06,
  /// Spreading factor 7.
  Sf7 = 0x07,
  /// Spreading factor 8.
  Sf8 = 0x08,
  /// Spreading factor 9.
  Sf9 = 0x09,
  /// Spreading factor 10.
  Sf10 = 0x0a,
  /// Spreading factor 11.
  Sf11 = 0x0b,
  /// Spreading factor 12.
  Sf12 = 0x0c,
}

export enum LoRaBandwidth {
  /// 7.81 kHz
  Bw7 = 0x00,
  /// 10.42 kHz
  Bw10 = 0x08,
  /// 15.63 kHz
  Bw15 = 0x01,
  /// 20.83 kHz
  Bw20 = 0x09,
  /// 31.25 kHz
  Bw31 = 0x02,
  /// 41.67 kHz
  Bw41 = 0x0a,
  /// 62.50 kHz
  Bw62 = 0x03,
  /// 125 kHz
  Bw125 = 0x04,
  /// 250 kHz
  Bw250 = 0x05,
  /// 500 kHz
  Bw500 = 0x06,
}

export enum LoRaCodingRate {
  /// No forward error correction coding rate 4/4
  ///
  /// Overhead ratio of 1
  Cr44 = 0x00,
  /// Forward error correction coding rate 4/5
  ///
  /// Overhead ratio of 1.25
  Cr45 = 0x1,
  /// Forward error correction coding rate 4/6
  ///
  /// Overhead ratio of 1.5
  Cr46 = 0x2,
  /// Forward error correction coding rate 4/7
  ///
  /// Overhead ratio of 1.75
  Cr47 = 0x3,
  /// Forward error correction coding rate 4/8
  ///
  /// Overhead ratio of 2
  Cr48 = 0x4,
}
