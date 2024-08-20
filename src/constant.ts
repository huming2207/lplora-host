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
