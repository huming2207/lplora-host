import { Transform, TransformCallback } from "stream";
import crc from "crc/crc16kermit";

export class LpLoraPacketCrcChecker extends Transform {
  override _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    if (!Buffer.isBuffer(chunk)) {
      callback(new TypeError(`Chunk isn't a buffer! It's ${Object.prototype.toString.call(chunk)}`));
      return;
    }

    const expectedCrc = chunk.readUint16LE(chunk.length - 2);
    const chunkForChecksum = chunk.subarray(0, chunk.length - 2);
    const actualCrc = crc(chunkForChecksum);
    if (expectedCrc !== actualCrc) {
      callback(new Error(`CRC mismatch! Want ${expectedCrc.toString(16)} got ${actualCrc.toString(16)}`));
      return;
    }

    this.push(chunkForChecksum);
  }
}
