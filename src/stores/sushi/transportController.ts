import {
  TransportControllerClient,
} from "@/proto/sushi/sushi_rpc.client";
import {
  GenericVoidValue,
  GenericFloatValue,
  PlayingMode,
  PlayingMode_Mode,
  SyncMode,
  SyncMode_Mode,
  TimeSignature,
} from "@/proto/sushi/sushi_rpc";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";
import { RpcError } from "@protobuf-ts/runtime-rpc";

class SushiTransportController {
  private transport: GrpcWebFetchTransport;
  private client: TransportControllerClient;

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

    this.client = new TransportControllerClient(this.transport);
  }

  /**
   * Get the samplerate.
   */
  async getSamplerate(): Promise<number> {
    try {
      const { response } = await this.client.getSamplerate(GenericVoidValue.create());
      return response.value || 0;
    } catch (err) {
      this.handleError(err, "Error getting samplerate.");
      throw err;
    }
  }

  /**
   * Get the current playing mode.
   */
  async getPlayingMode(): Promise<PlayingMode> {
    try {
      const { response } = await this.client.getPlayingMode(GenericVoidValue.create());
      return response || PlayingMode_Mode.STOPPED;
    } catch (err) {
      this.handleError(err, "Error getting playing mode.");
      throw err;
    }
  }

  /**
   * Get the current sync mode.
   */
  async getSyncMode(): Promise<SyncMode> {
    try {
      const { response } = await this.client.getSyncMode(GenericVoidValue.create());
      return response || SyncMode_Mode.INTERNAL;
    } catch (err) {
      this.handleError(err, "Error getting sync mode.");
      throw err;
    }
  }

  /**
   * Get the current time signature.
   */
  async getTimeSignature(): Promise<TimeSignature> {
    try {
      const { response } = await this.client.getTimeSignature(GenericVoidValue.create());
      return response;
    } catch (err) {
      this.handleError(err, "Error getting time signature.");
      throw err;
    }
  }

  /**
   * Get the current tempo.
   */
  async getTempo(): Promise<number> {
    try {
      const { response } = await this.client.getTempo(GenericVoidValue.create());
      return response.value || 0;
    } catch (err) {
      this.handleError(err, "Error getting tempo.");
      throw err;
    }
  }

  /**
   * Set the tempo.
   * @param tempo The new tempo value.
   */
  async setTempo(tempo: number): Promise<void> {
    try {
      await this.client.setTempo(GenericFloatValue.create({ value: tempo }));
      console.log(`Tempo set to ${tempo}.`);
    } catch (err) {
      this.handleError(err, `Error setting tempo to ${tempo}.`);
      throw err;
    }
  }

  /**
   * Set the playing mode.
   * @param mode The new playing mode.
   */
  async setPlayingMode(mode: PlayingMode): Promise<void> {
    try {
      await this.client.setPlayingMode(mode);
      console.log(`Playing mode set to ${mode}.`);
    } catch (err) {
      this.handleError(err, `Error setting playing mode to ${mode}.`);
      throw err;
    }
  }

  /**
   * Set the sync mode.
   * @param mode The new sync mode.
   */
  async setSyncMode(mode: SyncMode): Promise<void> {
    try {
      await this.client.setSyncMode(mode);
      console.log(`Sync mode set to ${mode}.`);
    } catch (err) {
      this.handleError(err, `Error setting sync mode to ${mode}.`);
      throw err;
    }
  }

  /**
   * Set the time signature.
   * @param timeSignature The new time signature.
   */
  async setTimeSignature(timeSignature: TimeSignature): Promise<void> {
    try {
      await this.client.setTimeSignature(timeSignature);
      console.log("Time signature set.");
    } catch (err) {
      this.handleError(err, "Error setting time signature.");
      throw err;
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

export default SushiTransportController;
