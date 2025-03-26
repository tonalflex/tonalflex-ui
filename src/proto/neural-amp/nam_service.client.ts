// @generated by protobuf-ts 2.9.4 with parameter client_generic
// @generated from protobuf file "neural-amp/nam_service.proto" (syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { NeuralAmpService } from "./nam_service";
import type { StorageLocationResponse } from "./nam_service";
import type { StorageLocationRequest } from "./nam_service";
import type { UploadResponse } from "./nam_service";
import type { NAMFileChunk } from "./nam_service";
import type { ClientStreamingCall } from "@protobuf-ts/runtime-rpc";
import type { NAMFileResponse } from "./nam_service";
import type { NAMFileRequest } from "./nam_service";
import type { NAMStoragePath } from "./nam_service";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { NAMFileList } from "./nam_service";
import type { EmptyRequest } from "./nam_service";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service NeuralAmpService
 */
export interface INeuralAmpServiceClient {
    /**
     * ✅ Get list of available NAM files
     *
     * @generated from protobuf rpc: GetNAMFileList(EmptyRequest) returns (NAMFileList);
     */
    getNAMFileList(input: EmptyRequest, options?: RpcOptions): UnaryCall<EmptyRequest, NAMFileList>;
    /**
     * ✅ Get current storage path
     *
     * @generated from protobuf rpc: GetNAMStoragePath(EmptyRequest) returns (NAMStoragePath);
     */
    getNAMStoragePath(input: EmptyRequest, options?: RpcOptions): UnaryCall<EmptyRequest, NAMStoragePath>;
    /**
     * ✅ Switch to a NAM file
     *
     * @generated from protobuf rpc: SwitchNAMFile(NAMFileRequest) returns (NAMFileResponse);
     */
    switchNAMFile(input: NAMFileRequest, options?: RpcOptions): UnaryCall<NAMFileRequest, NAMFileResponse>;
    /**
     * ✅ Delete a NAM file
     *
     * @generated from protobuf rpc: DeleteNAMFile(NAMFileRequest) returns (NAMFileResponse);
     */
    deleteNAMFile(input: NAMFileRequest, options?: RpcOptions): UnaryCall<NAMFileRequest, NAMFileResponse>;
    /**
     * ✅ Upload a new NAM file
     *
     * @generated from protobuf rpc: UploadNAMFile(stream NAMFileChunk) returns (UploadResponse);
     */
    uploadNAMFile(options?: RpcOptions): ClientStreamingCall<NAMFileChunk, UploadResponse>;
    /**
     * @generated from protobuf rpc: SetStorageLocation(StorageLocationRequest) returns (StorageLocationResponse);
     */
    setStorageLocation(input: StorageLocationRequest, options?: RpcOptions): UnaryCall<StorageLocationRequest, StorageLocationResponse>;
}
/**
 * @generated from protobuf service NeuralAmpService
 */
export class NeuralAmpServiceClient implements INeuralAmpServiceClient, ServiceInfo {
    typeName = NeuralAmpService.typeName;
    methods = NeuralAmpService.methods;
    options = NeuralAmpService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * ✅ Get list of available NAM files
     *
     * @generated from protobuf rpc: GetNAMFileList(EmptyRequest) returns (NAMFileList);
     */
    getNAMFileList(input: EmptyRequest, options?: RpcOptions): UnaryCall<EmptyRequest, NAMFileList> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<EmptyRequest, NAMFileList>("unary", this._transport, method, opt, input);
    }
    /**
     * ✅ Get current storage path
     *
     * @generated from protobuf rpc: GetNAMStoragePath(EmptyRequest) returns (NAMStoragePath);
     */
    getNAMStoragePath(input: EmptyRequest, options?: RpcOptions): UnaryCall<EmptyRequest, NAMStoragePath> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<EmptyRequest, NAMStoragePath>("unary", this._transport, method, opt, input);
    }
    /**
     * ✅ Switch to a NAM file
     *
     * @generated from protobuf rpc: SwitchNAMFile(NAMFileRequest) returns (NAMFileResponse);
     */
    switchNAMFile(input: NAMFileRequest, options?: RpcOptions): UnaryCall<NAMFileRequest, NAMFileResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<NAMFileRequest, NAMFileResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * ✅ Delete a NAM file
     *
     * @generated from protobuf rpc: DeleteNAMFile(NAMFileRequest) returns (NAMFileResponse);
     */
    deleteNAMFile(input: NAMFileRequest, options?: RpcOptions): UnaryCall<NAMFileRequest, NAMFileResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<NAMFileRequest, NAMFileResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * ✅ Upload a new NAM file
     *
     * @generated from protobuf rpc: UploadNAMFile(stream NAMFileChunk) returns (UploadResponse);
     */
    uploadNAMFile(options?: RpcOptions): ClientStreamingCall<NAMFileChunk, UploadResponse> {
        const method = this.methods[4], opt = this._transport.mergeOptions(options);
        return stackIntercept<NAMFileChunk, UploadResponse>("clientStreaming", this._transport, method, opt);
    }
    /**
     * @generated from protobuf rpc: SetStorageLocation(StorageLocationRequest) returns (StorageLocationResponse);
     */
    setStorageLocation(input: StorageLocationRequest, options?: RpcOptions): UnaryCall<StorageLocationRequest, StorageLocationResponse> {
        const method = this.methods[5], opt = this._transport.mergeOptions(options);
        return stackIntercept<StorageLocationRequest, StorageLocationResponse>("unary", this._transport, method, opt, input);
    }
}
