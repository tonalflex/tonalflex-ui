import {
  GenericVoidValue,
  ParameterNotificationBlocklist,
  PropertyNotificationBlocklist,
  TransportUpdate,
  CpuTimings,
  TrackUpdate,
  ProcessorUpdate,
  ParameterUpdate,
  PropertyValue,
} from "@/proto/sushi/sushi_rpc";
import { NotificationControllerClient } from "@/proto/sushi/sushi_rpc.client"; // Use the gRPC client
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { RpcError, ServerStreamingCall } from "@protobuf-ts/runtime-rpc";
import type { RpcInterceptor, RpcOptions, MethodInfo, UnaryCall } from "@protobuf-ts/runtime-rpc";

class SushiNotificationController {
  private transport: GrpcWebFetchTransport;
  private client: NotificationControllerClient;

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

    this.client = new NotificationControllerClient(this.transport);
  }

  private handleStream<T extends object>(
    call: ServerStreamingCall<object, T>,
    onUpdate: (update: T) => void,
    onError: (error: RpcError) => void
  ): () => void {
    // Listen for message updates
    call.responses.onMessage(onUpdate);

    // Listen for errors and handle RpcError specifically
    call.responses.onError((reason) => {
      if (reason instanceof RpcError) {
        onError(reason); // Pass the RpcError object to the callback
      } else {
        console.error("Unexpected error in streaming:", reason);
      }
    });

    // Return a cleanup function to cancel the stream
    return () => {
      if ("cancel" in call && typeof call.cancel === "function") {
        call.cancel(); // Cancel the stream safely
      } else {
        console.warn("Attempted to cancel a stream that does not support cancellation.");
      }
    };
  }

  /**
   * Subscribe to transport changes.
   */
  subscribeToTransportChanges(
    onUpdate: (update: TransportUpdate) => void,
    onError: (error: RpcError) => void
  ): () => void {
    const call = this.client.subscribeToTransportChanges(GenericVoidValue.create());
    return this.handleStream(call, onUpdate, onError);
  }

  /**
   * Subscribe to engine CPU timing updates.
   */
  subscribeToEngineCpuTimingUpdates(
    onUpdate: (update: CpuTimings) => void,
    onError: (error: RpcError) => void
  ): () => void {
    const call = this.client.subscribeToEngineCpuTimingUpdates(GenericVoidValue.create());
    return this.handleStream(call, onUpdate, onError);
  }

  /**
   * Subscribe to track changes.
   */
  subscribeToTrackChanges(
    onUpdate: (update: TrackUpdate) => void,
    onError: (error: RpcError) => void
  ): () => void {
    const call = this.client.subscribeToTrackChanges(GenericVoidValue.create());
    return this.handleStream(call, onUpdate, onError);
  }

  /**
   * Subscribe to processor changes.
   */
  subscribeToProcessorChanges(
    onUpdate: (update: ProcessorUpdate) => void,
    onError: (error: RpcError) => void
  ): () => void {
    const call = this.client.subscribeToProcessorChanges(GenericVoidValue.create());
    return this.handleStream(call, onUpdate, onError);
  }

  /**
   * Subscribe to parameter updates.
   */
  subscribeToParameterUpdates(
    blocklist: ParameterNotificationBlocklist,
    onUpdate: (update: ParameterUpdate) => void,
    onError: (error: RpcError) => void
  ): () => void {
    const call = this.client.subscribeToParameterUpdates(blocklist);
    return this.handleStream(call, onUpdate, onError);
  }

  /**
   * Subscribe to property updates.
   */
  subscribeToPropertyUpdates(
    blocklist: PropertyNotificationBlocklist,
    onUpdate: (update: PropertyValue) => void,
    onError: (error: RpcError) => void
  ): () => void {
    const call = this.client.subscribeToPropertyUpdates(blocklist);
    return this.handleStream(call, onUpdate, onError);
  }
}

export default SushiNotificationController;
