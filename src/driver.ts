import { SerialPort, SlipDecoder } from "serialport";
import { LpLoraPacketCrcChecker } from "./packetDecoder";
import crc from "crc/crc16kermit";
import { deserializeUartPacket, UartPacket, UartPingPacket } from "./packet";
import Stream from "stream";
import {
  LpLoraDriverEvents,
  SLIP_END,
  SLIP_ESC,
  SLIP_ESC_END,
  SLIP_ESC_ESC,
  SLIP_ESC_START,
  SLIP_START,
} from "./constant";

export class LpLoraDriver extends Stream.EventEmitter<LpLoraDriverEvents> {
  protected uart: SerialPort;
  protected decoder: LpLoraPacketCrcChecker;
  protected cachedData: Buffer = Buffer.alloc(0);

  private createDecoder = () => {
    this.decoder.on("data", (chunk: Buffer) => {
      this.emit("rawDataReceived", chunk);
      this.cachedData = Buffer.concat([this.cachedData, chunk]);
      try {
        const packet = deserializeUartPacket(chunk);
        if (packet !== null) {
          this.emit("packetReceived", packet);
        } else {
          console.warn("Packet is null?");
        }
      } catch (err) {
        this.emit("error", err);
      }
    });

    this.decoder.on("end", (chunk: Buffer) => {
      this.emit("rawDataReceived", chunk);
      this.cachedData = Buffer.concat([this.cachedData, chunk]);
      this.emit("end", this.cachedData);
      this.cachedData = Buffer.alloc(0);
      this.decoder = this.uart.pipe(
        new SlipDecoder({
          START: 0xa5,
          END: 0xc0,
          ESC: 0xdb,
          ESC_END: 0xdc,
          ESC_ESC: 0xdd,
          ESC_START: 0xde,
        }),
      );
    });
    this.decoder.on("close", () => {
      this.cachedData = Buffer.alloc(0);
      this.decoder = this.uart.pipe(
        new SlipDecoder({
          START: 0xa5,
          END: 0xc0,
          ESC: 0xdb,
          ESC_END: 0xdc,
          ESC_ESC: 0xdd,
          ESC_START: 0xde,
        }),
      );
    });
    this.decoder.on("error", (err) => {
      this.emit("error", err);
      this.cachedData = Buffer.alloc(0);
      this.decoder = this.uart.pipe(
        new SlipDecoder({
          START: 0xa5,
          END: 0xc0,
          ESC: 0xdb,
          ESC_END: 0xdc,
          ESC_ESC: 0xdd,
          ESC_START: 0xde,
        }),
      );
    });
  };

  /**
   * Constructor of LpLoRa driver
   * @param port UART port, e.g. "/dev/ttyUSB0"
   * @param baud Leave 0 or null for 9600 by default
   * @param stopBit Leave null to be 1 by default
   */
  constructor(port: string, baud?: number, stopBit?: 1 | 2 | 1.5 | null | undefined) {
    super();
    this.uart = new SerialPort({
      path: port,
      baudRate: baud || 9600,
      stopBits: stopBit || 1,
    });

    this.decoder = this.uart.pipe(
      new SlipDecoder({
        START: 0xa5,
        END: 0xc0,
        ESC: 0xdb,
        ESC_END: 0xdc,
        ESC_ESC: 0xdd,
        ESC_START: 0xde,
      }),
    );

    // const uartPort = this.uart;
    // uartPort.on("readable", () => {
    //   console.log("Data:", uartPort.read());
    // });

    this.createDecoder();
  }

  public recvPacket = (packet: Buffer): UartPacket | null => {
    return deserializeUartPacket(packet);
  };

  public sendPing = async (): Promise<void> => {
    const packet = new UartPingPacket();
    await this.sendPacket(packet);
  };

  public sendPacket = async (packet: UartPacket): Promise<void> => {
    await this.sendPacketBuffer(packet.serialize());
  };

  public sendPacketBuffer = async (data: Buffer): Promise<void> => {
    const checksum = crc(data);
    const checksumBuf = Buffer.alloc(2);
    checksumBuf.writeUInt16LE(checksum);
    const packetBuf = Buffer.concat([data, checksumBuf]);

    let idx = 0;
    const encodedBuf = Buffer.alloc(packetBuf.length * 2 + 2); // Worst case scenario of SLIP (with no SLIP_START end END conunted)
    encodedBuf[idx++] = SLIP_START;
    for (const b of packetBuf) {
      switch (b) {
        case SLIP_START: {
          encodedBuf[idx++] = SLIP_ESC;
          encodedBuf[idx++] = SLIP_ESC_START;
          break;
        }
        case SLIP_END: {
          encodedBuf[idx++] = SLIP_ESC;
          encodedBuf[idx++] = SLIP_ESC_END;
          break;
        }
        case SLIP_ESC: {
          encodedBuf[idx++] = SLIP_ESC;
          encodedBuf[idx++] = SLIP_ESC_ESC;
          break;
        }
        default: {
          encodedBuf[idx++] = b;
        }
      }
    }

    encodedBuf[idx++] = SLIP_END;
    const finalBuf = encodedBuf.subarray(0, idx);

    this.uart.write(finalBuf);

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
