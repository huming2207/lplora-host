import { PacketType } from "./constant";
import { LpLoraCorruptedError, LpLoraTypeError } from "./errors";

export const deserializeUartPacket = (data: Buffer): UartPacket | null => {
  if (data.length < 3) {
    throw new LpLoraCorruptedError(`UartPacket header expects packet longer than 5, got ${data.length}`);
  }

  const pktType: PacketType | undefined = PacketType[PacketType[data[0]] as keyof typeof PacketType];
  if (pktType === undefined) {
    throw new LpLoraTypeError(`Unknown packet type ${data[0]}`);
  }

  switch (pktType) {
    case PacketType.Ping: {
      const packet = new UartPingPacket();
      packet.deserialize(data);
      return packet;
    }

    case PacketType.Ack: {
      const packet = new UartAckPacket();
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
  protected makeHeader(): Buffer {
    let buf = Buffer.alloc(1);
    buf[0] = this.packetType;

    if (this.payload === null || !Buffer.isBuffer(this.payload) || this.payload.length < 1) {
      buf = Buffer.concat([buf, Buffer.alloc(2)]);
    } else {
      const lenBuf = Buffer.alloc(2);
      lenBuf.writeUint16LE(this.payload.length);
      buf = Buffer.concat([buf, lenBuf]);
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

export class UartPingPacket extends UartPacket {
  public override serialize(): Buffer {
    this.packetType = PacketType.Ping;
    this.payload = null;
    const header = this.makeHeader();
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
    const header = this.makeHeader();
    return header;
  }

  public override deserialize(data: Buffer): void {
    this.deserializeHeader(data);
  }
}

export type LpLoraDriverEvents = {
  packetReceived: [packet: UartPacket];
  rawDataReceived: [data: Buffer];
  fullDataReceived: [data: Buffer];
  error: [err: Error | unknown | object];
};

export const SLIP_START = 0xa5;
export const SLIP_END = 0xc0;
export const SLIP_ESC = 0xdb;
export const SLIP_ESC_END = 0xdc;
export const SLIP_ESC_ESC = 0xdd;
export const SLIP_ESC_START = 0xde;
