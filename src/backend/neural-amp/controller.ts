// src/stores/neuralAmpStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { NeuralAmpServiceClient } from '@/proto/neural-amp/nam_service.client';
import {
  EmptyRequest,
  NAMFileList,
  NAMStoragePath,
  NAMFileRequest,
  NAMFileResponse,
  NAMFileChunk,
  UploadResponse,
  StorageLocationRequest,
  StorageLocationResponse
} from '@/proto/neural-amp/nam_service';
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from '@protobuf-ts/runtime-rpc';

export const useNeuralAmpStore = defineStore('neuralAmp', () => {
  // State
  const fileList = ref<string[]>([]);
  const storagePath = ref<string>('');
  const lastMessage = ref<string>('');

  // gRPC Client Setup
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
          TE: 'trailers'
        }
      };
      return next(method, input, updatedOptions);
    }
  };

  const transport = new GrpcWebFetchTransport({
    baseUrl: 'http://your-grpc-server:port', // Replace with your server URL
    interceptors: [interceptor]
  });

  const client = new NeuralAmpServiceClient(transport);

  // Actions with explicit type annotations
  async function getNAMFileList() {
    try {
      const { response } = await client.getNAMFileList(EmptyRequest.create());
      const result: NAMFileList = response; // Explicitly use NAMFileList
      fileList.value = result.filenames;
      lastMessage.value = 'Fetched file list successfully';
    } catch (error) {
      lastMessage.value = `Error fetching file list: ${(error as Error).message}`;
    }
  }

  async function getNAMStoragePath() {
    try {
      const { response } = await client.getNAMStoragePath(EmptyRequest.create());
      const result: NAMStoragePath = response; // Explicitly use NAMStoragePath
      storagePath.value = result.path;
      lastMessage.value = 'Fetched storage path successfully';
    } catch (error) {
      lastMessage.value = `Error fetching storage path: ${(error as Error).message}`;
    }
  }

  async function switchNAMFile(filename: string) {
    try {
      const request = NAMFileRequest.create({ filename });
      const { response } = await client.switchNAMFile(request);
      const result: NAMFileResponse = response; // Explicitly use NAMFileResponse
      lastMessage.value = result.message;
    } catch (error) {
      lastMessage.value = `Error switching file: ${(error as Error).message}`;
    }
  }

  async function deleteNAMFile(filename: string) {
    try {
      const request = NAMFileRequest.create({ filename });
      const { response } = await client.deleteNAMFile(request);
      const result: NAMFileResponse = response; // Explicitly use NAMFileResponse
      lastMessage.value = result.message;
      await getNAMFileList(); // Refresh list
    } catch (error) {
      lastMessage.value = `Error deleting file: ${(error as Error).message}`;
    }
  }

  async function uploadNAMFile(filename: string, data: Uint8Array) {
    try {
      const call = client.uploadNAMFile();
      const chunk = NAMFileChunk.create({ filename, data });
      await call.requests.send(chunk);
      await call.requests.complete();
      const response: UploadResponse = await call.response; // Explicitly use UploadResponse
      lastMessage.value = response.message;
      await getNAMFileList(); // Refresh list
    } catch (error) {
      lastMessage.value = `Error uploading file: ${(error as Error).message}`;
    }
  }

  async function setStorageLocation(useSdcard: boolean) {
    try {
      const request = StorageLocationRequest.create({ useSdcard });
      const { response } = await client.setStorageLocation(request);
      const result: StorageLocationResponse = response; // Explicitly use StorageLocationResponse
      lastMessage.value = result.message;
      storagePath.value = result.currentPath;
    } catch (error) {
      lastMessage.value = `Error setting storage location: ${(error as Error).message}`;
    }
  }

  return {
    fileList,
    storagePath,
    lastMessage,
    getNAMFileList,
    getNAMStoragePath,
    switchNAMFile,
    deleteNAMFile,
    uploadNAMFile,
    setStorageLocation
  };
});