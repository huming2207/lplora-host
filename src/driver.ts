import { SerialPort, SlipDecoder, SlipEncoder } from "serialport";
import { LpLoraPacketCrcChecker } from "./packetDecoder";
import crc from "crc/crc16kermit";
import { UartPacket } from "./defs";
import { EventEmitter } from "stream";

export class LpLoraDriver extends EventEmitter {
  protected uart: SerialPort;
  protected decoder: LpLoraPacketCrcChecker;
  private static createDecoder = (): LpLoraPacketCrcChecker => {
    return new SlipDecoder({
      START: 0xa5,
      END: 0xc0,
      ESC: 0xdb,
      ESC_END: 0xdc,
      ESC_ESC: 0xdd,
      ESC_START: 0xde,
    }).pipe(new LpLoraPacketCrcChecker());
  };

  /**
   * Constructor of LpLoRa driver
   * @param port UART port, e.g. "/dev/ttyUSB0"
   * @param baud Leave 0 or null for 9600 by default
   * @param stopBit Leave null to be 2 by default
   */
  constructor(port: string, baud?: number, stopBit?: 1 | 2 | 1.5 | null | undefined) {
    super();
    this.uart = new SerialPort({
      path: port,
      baudRate: baud || 9600,
      stopBits: stopBit || 1,
    });

    this.decoder = this.uart.pipe(LpLoraDriver.createDecoder());
  }

  public sendPacket = async (packet: UartPacket): Promise<void> => {
    await this.sendPacketBuffer(packet.serialize());
  };

  public sendPacketBuffer = async (data: Buffer): Promise<void> => {
    const encoder = new SlipEncoder({
      START: 0xa5,
      END: 0xc0,
      ESC: 0xdb,
      ESC_END: 0xdc,
      ESC_ESC: 0xdd,
      ESC_START: 0xde,
    });

    encoder.push(data);

    const checksum = crc(data);
    const checksumBuf = Buffer.alloc(2);
    checksumBuf.writeUInt16LE(checksum);
    encoder.push(checksumBuf);
    encoder.push(null);
    encoder.pipe(this.uart);

    return new Promise((resolve, reject) => {
      this.uart.drain((err) => {
        if (err) {
          console.error("sendPacketBuffer: failed to flush UART");
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };
}
