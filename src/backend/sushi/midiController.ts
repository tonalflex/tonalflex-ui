import {
  GenericVoidValue,
  GenericIntValue,
  MidiClockSetRequest,
  MidiKbdConnectionList,
  MidiCCConnectionList,
  MidiPCConnectionList,
} from "@/proto/sushi/sushi_rpc";
import { MidiControllerClient } from "@/proto/sushi/sushi_rpc.client"; // Use the gRPC client
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";
import { RpcError } from "@protobuf-ts/runtime-rpc";

class SushiMidiController {
  private transport: GrpcWebFetchTransport;
  private client: MidiControllerClient;

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

    this.client = new MidiControllerClient(this.transport);
  }

  /**
   * Get the number of MIDI input ports.
   */
  async getInputPorts(): Promise<number> {
    try {
      const { response } = await this.client.getInputPorts(GenericVoidValue.create());
      return response.value;
    } catch (err) {
      this.handleError(err, "Error fetching MIDI input ports");
      throw err;
    }
  }

  /**
   * Get the number of MIDI output ports.
   */
  async getOutputPorts(): Promise<number> {
    try {
      const { response } = await this.client.getOutputPorts(GenericVoidValue.create());
      return response.value;
    } catch (err) {
      this.handleError(err, "Error fetching MIDI output ports");
      throw err;
    }
  }

  /**
   * Get all keyboard input connections.
   */
  async getAllKbdInputConnections(): Promise<MidiKbdConnectionList> {
    try {
      const { response } = await this.client.getAllKbdInputConnections(GenericVoidValue.create());
      return response;
    } catch (err) {
      this.handleError(err, "Error fetching all keyboard input connections");
      throw err;
    }
  }

  /**
   * Get all keyboard output connections.
   */
  async getAllKbdOutputConnections(): Promise<MidiKbdConnectionList> {
    try {
      const { response } = await this.client.getAllKbdOutputConnections(GenericVoidValue.create());
      return response;
    } catch (err) {
      this.handleError(err, "Error fetching all keyboard output connections");
      throw err;
    }
  }

  /**
   * Get all MIDI CC input connections.
   */
  async getAllCCInputConnections(): Promise<MidiCCConnectionList> {
    try {
      const { response } = await this.client.getAllCCInputConnections(GenericVoidValue.create());
      return response;
    } catch (err) {
      this.handleError(err, "Error fetching all MIDI CC input connections");
      throw err;
    }
  }

  /**
   * Get all MIDI Program Change (PC) input connections.
   */
  async getAllPCInputConnections(): Promise<MidiPCConnectionList> {
    try {
      const { response } = await this.client.getAllPCInputConnections(GenericVoidValue.create());
      return response;
    } catch (err) {
      this.handleError(err, "Error fetching all MIDI PC input connections");
      throw err;
    }
  }

  /**
   * Get MIDI clock output enabled state.
   */
  async getMidiClockOutputEnabled(port: number): Promise<boolean> {
    try {
      const request = GenericIntValue.create({ value: port });
      const { response } = await this.client.getMidiClockOutputEnabled(request);
      return response.value;
    } catch (err) {
      this.handleError(err, "Error fetching MIDI clock output enabled state");
      throw err;
    }
  }

  /**
   * Set MIDI clock output enabled state.
   */
  async setMidiClockOutputEnabled(port: number, enabled: boolean): Promise<void> {
    try {
      const request = MidiClockSetRequest.create({ port, enabled });
      await this.client.setMidiClockOutputEnabled(request);
      console.log(`Set MIDI clock output enabled state for port ${port} to ${enabled}`);
    } catch (err) {
      this.handleError(err, "Error setting MIDI clock output enabled state");
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

export default SushiMidiController;
