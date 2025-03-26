// src/stores/sushi/SushiAudioGraphController.ts
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { AudioGraphControllerClient } from "@/proto/sushi/sushi_rpc.client";
import {
  GenericVoidValue,
  GenericStringValue,
  ProcessorInfoList,
  TrackInfoList,
  TrackIdentifier,
  TrackInfo,
  ProcessorIdentifier,
  ProcessorInfo,
  GenericBoolValue,
  ProcessorState,
  ProcessorBypassStateSetRequest,
  ProcessorStateSetRequest,
  CreateTrackRequest,
  CreateMultibusTrackRequest,
  CreatePreTrackRequest,
  CreatePostTrackRequest,
  CreateProcessorRequest,
  MoveProcessorRequest,
  DeleteProcessorRequest,
  ProcessorPosition,
  PluginType_Type,
} from "@/proto/sushi/sushi_rpc";
import { RpcError } from "@protobuf-ts/runtime-rpc";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";

class SushiAudioGraphController {
  private transport: GrpcWebFetchTransport;
  private client: AudioGraphControllerClient;

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

    this.client = new AudioGraphControllerClient(this.transport);
  }

  async getAllProcessors(): Promise<ProcessorInfo[]> {
    try {
      const { response } = await this.client.getAllProcessors(GenericVoidValue.create());
      return response.processors || [];
    } catch (err) {
      this.handleError(err, "Error fetching all processors");
      throw err;
    }
  }

  async getAllTracks(): Promise<TrackInfo[]> {
    try {
      const { response } = await this.client.getAllTracks(GenericVoidValue.create());
      return response.tracks || [];
    } catch (err) {
      this.handleError(err, "Error fetching all tracks");
      throw err;
    }
  }

  async getTrackId(trackName: string): Promise<number> {
    try {
      const { response } = await this.client.getTrackId(GenericStringValue.create({ value: trackName }));
      return response.id || 0;
    } catch (err) {
      this.handleError(err, `Error fetching track ID for '${trackName}'`);
      throw err;
    }
  }

  async getTrackInfo(trackId: number): Promise<TrackInfo> {
    try {
      const { response } = await this.client.getTrackInfo(TrackIdentifier.create({ id: trackId }));
      return response;
    } catch (err) {
      this.handleError(err, `Error fetching track info for ID ${trackId}`);
      throw err;
    }
  }

  async getTrackProcessors(trackId: number): Promise<ProcessorInfo[]> {
    try {
      const { response } = await this.client.getTrackProcessors(TrackIdentifier.create({ id: trackId }));
      return response.processors || [];
    } catch (err) {
      this.handleError(err, `Error fetching processors for track ID ${trackId}`);
      throw err;
    }
  }

  async getProcessorId(processorName: string): Promise<number> {
    try {
      const { response } = await this.client.getProcessorId(GenericStringValue.create({ value: processorName }));
      return response.id || 0;
    } catch (err) {
      this.handleError(err, `Error fetching processor ID for '${processorName}'`);
      throw err;
    }
  }

  async getProcessorInfo(processorId: number): Promise<ProcessorInfo> {
    try {
      const { response } = await this.client.getProcessorInfo(ProcessorIdentifier.create({ id: processorId }));
      return response;
    } catch (err) {
      this.handleError(err, `Error fetching processor info for ID ${processorId}`);
      throw err;
    }
  }

  async getProcessorBypassState(processorId: number): Promise<boolean> {
    try {
      const { response } = await this.client.getProcessorBypassState(ProcessorIdentifier.create({ id: processorId }));
      return response.value;
    } catch (err) {
      this.handleError(err, `Error fetching bypass state for processor ID ${processorId}`);
      throw err;
    }
  }

  async getProcessorState(processorId: number): Promise<ProcessorState> {
    try {
      const { response } = await this.client.getProcessorState(ProcessorIdentifier.create({ id: processorId }));
      return response;
    } catch (err) {
      this.handleError(err, `Error fetching state for processor ID ${processorId}`);
      throw err;
    }
  }

  async setProcessorBypassState(processorId: number, bypass: boolean): Promise<void> {
    try {
      await this.client.setProcessorBypassState(
        ProcessorBypassStateSetRequest.create({
          processor: { id: processorId },
          value: bypass, // Changed from 'bypass' to 'value'
        })
      );
      console.log(`Set bypass state for processor ID ${processorId} to ${bypass}`);
    } catch (err) {
      this.handleError(err, `Error setting bypass state for processor ID ${processorId}`);
      throw err;
    }
  }

  async setProcessorState(processorId: number, state: ProcessorState): Promise<void> {
    try {
      await this.client.setProcessorState(
        ProcessorStateSetRequest.create({ processor: { id: processorId }, state })
      );
      console.log(`Set state for processor ID ${processorId}`);
    } catch (err) {
      this.handleError(err, `Error setting state for processor ID ${processorId}`);
      throw err;
    }
  }

  async createTrack(name: string, channels: number): Promise<void> {
    try {
      await this.client.createTrack(CreateTrackRequest.create({ name, channels }));
      console.log(`Created track '${name}' with ${channels} channels`);
    } catch (err) {
      this.handleError(err, `Error creating track '${name}'`);
      throw err;
    }
  }

  async createMultibusTrack(name: string, buses: number): Promise<void> {
    try {
      await this.client.createMultibusTrack(CreateMultibusTrackRequest.create({ name, buses }));
      console.log(`Created multibus track '${name}' with ${buses} buses`);
    } catch (err) {
      this.handleError(err, `Error creating multibus track '${name}'`);
      throw err;
    }
  }

  async createPreTrack(name?: string): Promise<void> {
    try {
      await this.client.createPreTrack(CreatePreTrackRequest.create(name ? { name } : {}));
      console.log(`Created pre-track${name ? ` '${name}'` : ""}`);
    } catch (err) {
      this.handleError(err, "Error creating pre-track");
      throw err;
    }
  }

  async createPostTrack(name?: string): Promise<void> {
    try {
      await this.client.createPostTrack(CreatePostTrackRequest.create(name ? { name } : {}));
      console.log(`Created post-track${name ? ` '${name}'` : ""}`);
    } catch (err) {
      this.handleError(err, "Error creating post-track");
      throw err;
    }
  }

  async createProcessorOnTrack(trackId: number, name: string, type: PluginType_Type, uid?: string, path?: string): Promise<void> {
    try {
      const request = CreateProcessorRequest.create({
        name,
        uid: uid || "",
        path: path || "",
        type: { type }, // PluginType message with enum value
        track: { id: trackId },
        position: { addToBack: true },
      });
      await this.client.createProcessorOnTrack(request);
      console.log(`Created processor '${name}' on track ID ${trackId}`);
    } catch (err) {
      this.handleError(err, `Error creating processor '${name}' on track ID ${trackId}`);
      throw err;
    }
  }

  async moveProcessorOnTrack(
    processorId: number,
    sourceTrackId: number,
    destTrackId: number,
    position: { addToBack?: boolean; beforeProcessorId?: number }
  ): Promise<void> {
    try {
      const positionMsg = ProcessorPosition.create({
        addToBack: position.addToBack ?? false,
        beforeProcessor: position.beforeProcessorId ? { id: position.beforeProcessorId } : undefined,
      });

      await this.client.moveProcessorOnTrack(
        MoveProcessorRequest.create({
          processor: { id: processorId },
          sourceTrack: { id: sourceTrackId },
          destTrack: { id: destTrackId },
          position: positionMsg,
        })
      );
      console.log(
        `Moved processor ID ${processorId} from track ID ${sourceTrackId} to track ID ${destTrackId} ` +
        `with position { addToBack: ${position.addToBack ?? false}, beforeProcessorId: ${position.beforeProcessorId ?? "none"} }`
      );
    } catch (err) {
      this.handleError(err, `Error moving processor ID ${processorId} from track ID ${sourceTrackId} to ${destTrackId}`);
      throw err;
    }
  }

  async deleteProcessorFromTrack(request: DeleteProcessorRequest): Promise<void> {
    try {
      await this.client.deleteProcessorFromTrack(request);
      console.log(`Deleted processor ID ${request.processor?.id} from track ID ${request.track?.id}`);
    } catch (err) {
      this.handleError(err, `Error deleting processor ID ${request.processor?.id} from track ID ${request.track?.id}`);
      throw err;
    }
  }

  async deleteTrack(trackId: number): Promise<void> {
    try {
      await this.client.deleteTrack(TrackIdentifier.create({ id: trackId }));
      console.log(`Deleted track ID ${trackId}`);
    } catch (err) {
      this.handleError(err, `Error deleting track ID ${trackId}`);
      throw err;
    }
  }

  private handleError(err: unknown, message: string): void {
    if (err instanceof RpcError) {
      console.error(`${message}: ${err.message}`);
    } else {
      console.error(`${message}: Unknown error`, err);
    }
  }
}

export default SushiAudioGraphController;