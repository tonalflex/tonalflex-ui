import {
  GenericVoidValue,
  AudioConnection,
  TrackIdentifier,
  AudioConnectionList,
} from "@/proto/sushi/sushi_rpc";
import { AudioRoutingControllerClient } from "@/proto/sushi/sushi_rpc.client"; // Use sushi_rpc.client.ts
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";
import { RpcError } from "@protobuf-ts/runtime-rpc";

class SushiAudioRoutingController {
  private transport: GrpcWebFetchTransport;
  private client: AudioRoutingControllerClient;

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

    this.client = new AudioRoutingControllerClient(this.transport);
  }

  /**
   * Get all input connections.
   */
  async getAllInputConnections(): Promise<AudioConnectionList> {
    try {
      const { response } = await this.client.getAllInputConnections(GenericVoidValue.create());
      return response;
    } catch (err) {
      this.handleError(err, "Error fetching all input connections");
      throw err;
    }
  }

  /**
   * Get all output connections.
   */
  async getAllOutputConnections(): Promise<AudioConnectionList> {
    try {
      const { response } = await this.client.getAllOutputConnections(GenericVoidValue.create());
      return response;
    } catch (err) {
      this.handleError(err, "Error fetching all output connections");
      throw err;
    }
  }

  /**
   * Get input connections for a track.
   */
  async getInputConnectionsForTrack(trackId: number): Promise<AudioConnectionList> {
    try {
      const { response } = await this.client.getInputConnectionsForTrack(TrackIdentifier.create({ id: trackId }));
      return response;
    } catch (err) {
      this.handleError(err, `Error fetching input connections for track ID ${trackId}`);
      throw err;
    }
  }

  /**
   * Get output connections for a track.
   */
  async getOutputConnectionsForTrack(trackId: number): Promise<AudioConnectionList> {
    try {
      const { response } = await this.client.getOutputConnectionsForTrack(TrackIdentifier.create({ id: trackId }));
      return response;
    } catch (err) {
      this.handleError(err, `Error fetching output connections for track ID ${trackId}`);
      throw err;
    }
  }

  /**
   * Connect an input channel to a track.
   */
  async connectInputChannelToTrack(connection: AudioConnection): Promise<void> {
    try {
      await this.client.connectInputChannelToTrack(connection);
      console.log(`Input channel connected to track.`);
    } catch (err) {
      this.handleError(err, "Error connecting input channel to track");
      throw err;
    }
  }

  /**
   * Connect an output channel from a track.
   */
  async connectOutputChannelFromTrack(connection: AudioConnection): Promise<void> {
    try {
      await this.client.connectOutputChannelFromTrack(connection);
      console.log(`Output channel connected from track.`);
    } catch (err) {
      this.handleError(err, "Error connecting output channel from track");
      throw err;
    }
  }

  /**
   * Disconnect an input connection.
   */
  async disconnectInput(connection: AudioConnection): Promise<void> {
    try {
      await this.client.disconnectInput(connection);
      console.log(`Input channel disconnected.`);
    } catch (err) {
      this.handleError(err, "Error disconnecting input channel");
      throw err;
    }
  }

  /**
   * Disconnect an output connection.
   */
  async disconnectOutput(connection: AudioConnection): Promise<void> {
    try {
      await this.client.disconnectOutput(connection);
      console.log(`Output channel disconnected.`);
    } catch (err) {
      this.handleError(err, "Error disconnecting output channel");
      throw err;
    }
  }

  /**
   * Disconnect all input connections from a track.
   */
  async disconnectAllInputsFromTrack(trackId: number): Promise<void> {
    try {
      await this.client.disconnectAllInputsFromTrack(TrackIdentifier.create({ id: trackId }));
      console.log(`All inputs disconnected from track ID ${trackId}.`);
    } catch (err) {
      this.handleError(err, `Error disconnecting all inputs from track ID ${trackId}`);
      throw err;
    }
  }

  /**
   * Disconnect all output connections from a track.
   */
  async disconnectAllOutputsFromTrack(trackId: number): Promise<void> {
    try {
      await this.client.disconnectAllOutputsFromTrack(TrackIdentifier.create({ id: trackId }));
      console.log(`All outputs disconnected from track ID ${trackId}.`);
    } catch (err) {
      this.handleError(err, `Error disconnecting all outputs from track ID ${trackId}`);
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

export default SushiAudioRoutingController;
