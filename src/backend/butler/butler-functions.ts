// src/stores/butlerStore.ts
import {
  SessionClient,
  FileClient,
  MidiClient,
  WifiClient,
} from '@/proto/butler/butler.client';
import {
  SaveSnapshotRequest,
  LoadSnapshotRequest,
  SaveSessionRequest,
  LoadSessionRequest,
  ListSessionsRequest,
  DeleteSessionRequest,
  RenameSessionRequest,
  UploadFileRequest,
  ListFilesRequest,
  DownloadFileRequest,
  DeleteFileRequest,
  RenameFileRequest,
  MidiConnectRequest,
  WifiCredentials,
  Empty,
} from '@/proto/butler/butler';
import type {
  SaveSnapshotResponse,
  LoadSnapshotResponse,
  SaveSessionResponse,
  LoadSessionResponse,
  ListSessionsResponse,
  DeleteSessionResponse,
  RenameSessionResponse,
  FileOperationResponse,
  ListFilesResponse,
  DownloadFileResponse,
  MidiDevicesResponse,
  MidiConnectResponse,
  WifiConnectResponse,
  AvailableNetworksResponse,
} from "@/proto/butler/butler";
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from '@protobuf-ts/runtime-rpc';
import { RpcError } from '@protobuf-ts/runtime-rpc';

class ButlerController {
  private transport: GrpcWebFetchTransport;
  private session: SessionClient;
  private file: FileClient;
  private midi: MidiClient;
  private wifi: WifiClient;

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

    this.session = new SessionClient(this.transport);
    this.file = new FileClient(this.transport);
    this.midi = new MidiClient(this.transport);
    this.wifi = new WifiClient(this.transport);
  }

  async saveSnapshot(jsonData: string): Promise<SaveSnapshotResponse> {
    const request = SaveSnapshotRequest.create({ jsonData });
    const { response } = await this.session.saveSnapshot(request);
    return response;
  }

  async loadSnapshot(): Promise<LoadSnapshotResponse> {
    const request = LoadSnapshotRequest.create();
    const { response } = await this.session.loadSnapshot(request);
    return response;
  }

  async saveSession(name: string, jsonData: string): Promise<SaveSessionResponse> {
    const request = SaveSessionRequest.create({ name, jsonData });
    const { response } = await this.session.saveSession(request);
    return response;
  }

  async loadSession(name: string): Promise<LoadSessionResponse> {
    const request = LoadSessionRequest.create({ name });
    const { response } = await this.session.loadSession(request);
    return response;
  }

  async listSessions(): Promise<ListSessionsResponse> {
    const { response } = await this.session.listSessions(ListSessionsRequest.create());
    return response;
  }

  async deleteSession(name: string): Promise<DeleteSessionResponse> {
    const request = DeleteSessionRequest.create({ name });
    const { response } = await this.session.deleteSession(request);
    return response;
  }

  async renameSession(oldName: string, newName: string): Promise<RenameSessionResponse> {
    const request = RenameSessionRequest.create({ oldName, newName });
    const { response } = await this.session.renameSession(request);
    return response;
  }

  // FILE
  async listFiles(folder: string): Promise<ListFilesResponse> {
    const request = ListFilesRequest.create({ folder });
    const { response } = await this.file.listFiles(request);
    return response;
  }

  async uploadFile(folder: string, filename: string, content: Uint8Array): Promise<FileOperationResponse> {
    const request = UploadFileRequest.create({ folder, filename, content });
    const { response } = await this.file.uploadFile(request);
    return response;
  }

  async downloadFile(folder: string, filename: string): Promise<DownloadFileResponse> {
    const request = DownloadFileRequest.create({ folder, filename });
    const { response } = await this.file.downloadFile(request);
    return response;
  }

  async deleteFile(folder: string, filename: string): Promise<FileOperationResponse> {
    const request = DeleteFileRequest.create({ folder, filename });
    const { response } = await this.file.deleteFile(request);
    return response;
  }

  async renameFile(folder: string, oldName: string, newName: string): Promise<FileOperationResponse> {
    const request = RenameFileRequest.create({ folder, oldName, newName });
    const { response } = await this.file.renameFile(request);
    return response;
  }

  // MIDI
  async listMidiDevices(): Promise<MidiDevicesResponse> {
    const { response } = await this.midi.listDevices(Empty.create());
    return response;
  }

  async connectMidiDevice(
    controllerClient: number,
    controllerPort: number,
    sushiClient: number,
    sushiPort: number
  ): Promise<MidiConnectResponse> {
    const request = MidiConnectRequest.create({
      controllerClient,
      controllerPort,
      sushiClient,
      sushiPort,
    });
    const { response } = await this.midi.connectDevice(request);
    return response;
  }

  // WIFI
  async listWifiNetworks(): Promise<AvailableNetworksResponse> {
    const { response } = await this.wifi.listAvailableNetworks(Empty.create());
    return response;
  }

  async connectToWifi(ssid: string, password: string): Promise<WifiConnectResponse> {
    const request = WifiCredentials.create({ ssid, password });
    const { response } = await this.wifi.connectToNetwork(request);
    return response;
  }

  private handleError(err: unknown, context: string): void {
    if (err instanceof RpcError) {
      console.error(`[Butler] Error ${context}:`, err.message);
    } else {
      console.error(`[Butler] Unknown error ${context}:`, err);
    }
  }
}

export default ButlerController;
