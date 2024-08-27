export class LpLoraError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public override toString(): string {
    return `${this.name}: ${this.message}`;
  }
}

export class LpLoraCorruptedError extends LpLoraError {
  constructor(message: string) {
    super(message);
  }
}

export class LpLoraTypeError extends LpLoraError {
  constructor(message: string) {
    super(message);
  }
}

export class LpLoraNotDeserializableError extends LpLoraError {
  constructor() {
    super("This packet is Tx-only, cannot deserialise");
  }
}
