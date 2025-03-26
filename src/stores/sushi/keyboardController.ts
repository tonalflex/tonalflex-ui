import {
  NoteOnRequest,
  NoteOffRequest,
  NoteAftertouchRequest,
  NoteModulationRequest,
} from "@/proto/sushi/sushi_rpc";
import { KeyboardControllerClient } from "@/proto/sushi/sushi_rpc.client"; // Use the gRPC client
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";
import { RpcError } from "@protobuf-ts/runtime-rpc";

class SushiKeyboardController {
  private transport: GrpcWebFetchTransport;
  private client: KeyboardControllerClient;

  constructor(baseUrl: string) {
    const interceptor: RpcInterceptor = {
      interceptUnary<T extends object, U extends object>(
        next: (method: MethodInfo<T, U>, input: T, options: RpcOptions) => UnaryCall<T, U>,
        method: MethodInfo<T, U>,
        input: T,
        options: RpcOptions
      ): UnaryCall<T, U> {
        const updatedOptions: RpcOptions = {
          ...options,
          meta: {
            ...options?.meta,
            TE: "trailers",
          },
        };
        return next(method, input, updatedOptions);
      },
    };

    this.transport = new GrpcWebFetchTransport({
      baseUrl,
      interceptors: [interceptor],
    });

    this.client = new KeyboardControllerClient(this.transport);
  }

  /**
   * Send Note On.
   */
  async sendNoteOn(note: number, velocity: number, channel: number): Promise<void> {
    try {
      const request = NoteOnRequest.create({ note, velocity, channel });
      await this.client.sendNoteOn(request);
      console.log(`Sent Note On: note=${note}, velocity=${velocity}, channel=${channel}`);
    } catch (err) {
      this.handleError(err, "Error sending Note On");
    }
  }

  /**
   * Send Note Off.
   */
  async sendNoteOff(note: number, channel: number): Promise<void> {
    try {
      const request = NoteOffRequest.create({ note, channel });
      await this.client.sendNoteOff(request);
      console.log(`Sent Note Off: note=${note}, channel=${channel}`);
    } catch (err) {
      this.handleError(err, "Error sending Note Off");
    }
  }

  /**
   * Send Note Aftertouch.
   */
  async sendNoteAftertouch(note: number, channel: number): Promise<void> {
    try {
      const request = NoteAftertouchRequest.create({ note, channel });
      await this.client.sendNoteAftertouch(request);
      console.log(`Sent Note Aftertouch: note=${note}, channel=${channel}`);
    } catch (err) {
      this.handleError(err, "Error sending Note Aftertouch");
    }
  }

  /**
   * Send Aftertouch (Polyphonic or Channel).
   */
  async sendAftertouch(value: number, channel: number): Promise<void> {
    try {
      const request = NoteModulationRequest.create({ value, channel });
      await this.client.sendAftertouch(request);
      console.log(`Sent Aftertouch: value=${value}, channel=${channel}`);
    } catch (err) {
      this.handleError(err, "Error sending Aftertouch");
    }
  }

  /**
   * Send Pitch Bend.
   */
  async sendPitchBend(value: number, channel: number): Promise<void> {
    try {
      const request = NoteModulationRequest.create({ value, channel });
      await this.client.sendPitchBend(request);
      console.log(`Sent Pitch Bend: value=${value}, channel=${channel}`);
    } catch (err) {
      this.handleError(err, "Error sending Pitch Bend");
    }
  }

  /**
   * Send Modulation.
   */
  async sendModulation(value: number, channel: number): Promise<void> {
    try {
      const request = NoteModulationRequest.create({ value, channel });
      await this.client.sendModulation(request);
      console.log(`Sent Modulation: value=${value}, channel=${channel}`);
    } catch (err) {
      this.handleError(err, "Error sending Modulation");
    }
  }

  /**
   * Handle errors for gRPC calls.
   */
  private handleError(err: unknown, message: string): void {
    if (err instanceof RpcError) {
      console.error(`${message}: ${err.message}`);
    } else {
      console.error(`${message}: Unknown error`, err);
    }
  }
}

export default SushiKeyboardController;
