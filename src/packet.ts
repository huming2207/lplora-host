import {
  LoRaBandwidth,
  LoRaCodingRate,
  LoRaSpreadingFactor,
  PacketType,
  RadioPaRampTime,
  RadioPaSelect,
} from "./constant";
import { LpLoraCorruptedError, LpLoraNotDeserializableError, LpLoraTypeError } from "./errors";
import crc from "crc/crc16kermit";

export const checkUartPacketCRC = (data: Buffer): boolean => {
  const expectedCrc = data.readUint16LE(data.length - 2);
  const chunkForChecksum = data.subarray(0, data.length - 2);
  const actualCrc = crc(chunkForChecksum);
  if (expectedCrc !== actualCrc) {
    console.warn(`CRC mismatched: got 0x${expectedCrc} expect 0x${actualCrc}`);
    return false;
  }

  return true;
};

export const deserializeUartPacket = (data: Buffer): UartPacket | null => {
  if (!checkUartPacketCRC(data)) {
    throw new LpLoraCorruptedError(`UartPacket corrupted??`);
  }

  if (data.length < 5) {
    throw new LpLoraCorruptedError(`UartPacket header expects packet longer than 5, got ${data.length}`);
  }

  const pktType: PacketType | undefined = PacketType[PacketType[data[0]] as keyof typeof PacketType];
  if (pktType === undefined) {
    throw new LpLoraTypeError(`Unknown packet type ${data[0]}`);
  }

  switch (pktType) {
    case PacketType.Pong: {
      const packet = new UartPongPacket();
      packet.deserialize(data);
      return packet;
    }

    case PacketType.Ack: {
      const packet = new UartAckPacket();
      packet.deserialize(data);
      return packet;
    }

    case PacketType.RadioReceivedPacket: {
      const packet = new UartRadioReceivedPacket();
      packet.deserialize(data);
      return packet;
    }

    default: {
      console.warn(`Unimplemented packet type received: ${pktType}`);
      break;
    }
  }

  return null;
};

export abstract class UartPacket {
  public packetType: PacketType;
  public payload?: Buffer | null;

  constructor() {
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public abstract serialize(): Buffer;
  public abstract deserialize(data: Buffer): void;
  protected prependHeader(): Buffer {
    let buf = Buffer.alloc(1);
    buf[0] = this.packetType;

    if (this.payload === null || !Buffer.isBuffer(this.payload) || this.payload.length < 1) {
      buf = Buffer.concat([buf, Buffer.alloc(2)]);
    } else {
      const lenBuf = Buffer.alloc(2);
      lenBuf.writeUint16LE(this.payload.length);
      buf = Buffer.concat([buf, lenBuf, this.payload]);
    }

    return buf;
  }

  protected deserializeHeader(data: Buffer) {
    if (data.length < 3) {
      throw new LpLoraCorruptedError(`UartPacket header expects packet longer than 5, got ${data.length}`);
    }

    const pktType: PacketType | undefined = PacketType[PacketType[data[0]] as keyof typeof PacketType];
    if (pktType === undefined) {
      throw new LpLoraTypeError(`Unknown packet type ${data[0]}`);
    } else {
      this.packetType = pktType;
    }

    const payloadLen = data.readUint16LE(1);
    if (payloadLen < 1) {
      this.payload = null;
    } else {
      if (payloadLen + 3 <= data.length) {
        this.payload = data.subarray(3, data.length);
      } else {
        throw new LpLoraCorruptedError(
          `Invalid length (only partial data received), got ${data.length} but reported ${payloadLen} bytes`,
        );
      }
    }
  }
}

export class UartRadioReceivedPacket extends UartPacket {
  public receivedData: Buffer;
  public packetRssi: number;
  public packetSnr: number;
  public override serialize(): Buffer {
    throw new LpLoraNotDeserializableError();
  }

  public override deserialize(data: Buffer): void {
    this.deserializeHeader(data); // Byte 0-2 are header
    if (data.length < 7) {
      throw new LpLoraCorruptedError(`Packet too short, got ${data.length}, expect at least 7 bytes`);
    }

    this.packetRssi = data.readInt16LE(3); // Byte 3-4 are RSSI
    this.packetSnr = data.readInt16LE(5); // Packet 5-6 are SNR

    if (data.length > 7) {
      this.receivedData = Buffer.from(data.subarray(7, data.length - 2));
    } else {
      this.receivedData = Buffer.alloc(0);
    }
  }
}

export class UartPingPacket extends UartPacket {
  public override serialize(): Buffer {
    this.packetType = PacketType.Ping;
    this.payload = null;
    const header = this.prependHeader();
    return header;
  }

  public override deserialize(data: Buffer): void {
    this.deserializeHeader(data);
  }
}

export class UartPongPacket extends UartPacket {
  public override serialize(): Buffer {
    this.packetType = PacketType.Pong;
    this.payload = null;
    const header = this.prependHeader();
    return header;
  }

  public override deserialize(data: Buffer): void {
    this.deserializeHeader(data);
  }
}

export class UartAckPacket extends UartPacket {
  public override serialize(): Buffer {
    this.packetType = PacketType.Ack;
    this.payload = null;
    const header = this.prependHeader();
    return header;
  }

  public override deserialize(data: Buffer): void {
    this.deserializeHeader(data);
  }
}

export abstract class UartTxOnlyPacket extends UartPacket {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override deserialize(_data: Buffer): void {
    throw new LpLoraNotDeserializableError();
  }
}

export class UartRadioPhyCfgPacket extends UartTxOnlyPacket {
  public paDutyCycle: number = 0x4;
  public hpMax: number = 0x7;
  public paSelect: RadioPaSelect = RadioPaSelect.PA_SELECT_HP;
  public txPower: number = 0x16;
  public rampTime: RadioPaRampTime = RadioPaRampTime.Micros10;
  public rxBoost: boolean = true;

  public override serialize(): Buffer {
    this.packetType = PacketType.RadioPhyConfig;
    this.payload = Buffer.from([
      this.paDutyCycle & 0xff,
      this.hpMax & 0xff,
      this.paSelect & 0xff,
      this.txPower & 0xff,
      this.rampTime & 0xff,
      this.rxBoost ? 1 : 0,
    ]);

    return this.prependHeader();
  }
}

export class UartRadioLoRaCfgPacket extends UartTxOnlyPacket {
  public preambleLen: number = 10;
  public fixedHeader: boolean = false;
  public payloadLen: number;
  public enableCRC: boolean = true;
  public invertIQ: boolean = false;
  public spreadFactor: LoRaSpreadingFactor = LoRaSpreadingFactor.Sf8;
  public bandwidth: LoRaBandwidth = LoRaBandwidth.Bw125;
  public codingRate: LoRaCodingRate = LoRaCodingRate.Cr45;
  public lowCodingRateOptimize: boolean =
    this.spreadFactor === LoRaSpreadingFactor.Sf12 || this.spreadFactor === LoRaSpreadingFactor.Sf11;
  public syncWord: Buffer = Buffer.from([0x14, 0x24]);

  public override serialize(): Buffer {
    this.packetType = PacketType.RadioLoraConfig;
    const preambleLenBuf = Buffer.alloc(2);
    preambleLenBuf.writeUInt16LE(this.preambleLen);

    let syncW: Buffer = this.syncWord;
    if (this.syncWord.length > 2) {
      syncW = this.syncWord.subarray(0, 2);
    }

    this.payload = Buffer.concat([
      preambleLenBuf,
      Buffer.from([
        this.fixedHeader ? 0 : 1,
        this.payloadLen & 0xff,
        this.enableCRC ? 1 : 0,
        this.invertIQ ? 1 : 0,
        this.spreadFactor & 0xff,
        this.bandwidth & 0xff,
        this.codingRate & 0xff,
        this.lowCodingRateOptimize ? 1 : 0,
      ]),
      syncW,
    ]);

    return this.prependHeader();
  }
}

export class UartRadioFreqCfgPacket extends UartTxOnlyPacket {
  public frequencyHz: number = 921000000;

  public override serialize(): Buffer {
    this.packetType = PacketType.RadioFreqConfig;
    const freqBuf = Buffer.alloc(4);
    freqBuf.writeUint32LE(this.frequencyHz);

    this.payload = freqBuf;
    return this.prependHeader();
  }
}

export class UartRadioRxPacket extends UartTxOnlyPacket {
  public timeoutMillisec: number = 10000;

  public override serialize(): Buffer {
    this.packetType = PacketType.RadioRecvStart;
    const buf = Buffer.alloc(4);
    buf.writeUint32LE(this.timeoutMillisec);

    this.payload = buf;
    return this.prependHeader();
  }
}

export class UartRadioTxPacket extends UartTxOnlyPacket {
  public override serialize(): Buffer {
    this.packetType = PacketType.RadioSend;
    return this.prependHeader();
  }
}
