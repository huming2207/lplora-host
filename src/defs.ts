import { PacketType } from "./constant";

export abstract class UartPacket {
  public packetType: PacketType;
  public payload?: Buffer | null;

  public abstract serialize(): Buffer;
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
}

export class UartPingPacket extends UartPacket {
  public serialize(): Buffer {
    this.packetType = PacketType.Ping;
    this.payload = null;
    const header = this.makeHeader();
    return header;
  }
}
