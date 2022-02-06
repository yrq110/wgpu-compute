import { ComputeContext } from "../ComputeContext";
import { GPUDataBuffer } from "./Buffer";

export class StorageBuffer {
    private _context: ComputeContext;

    private _buffer: GPUDataBuffer;

    public constructor(size: number, context: ComputeContext, flags: number = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST) {
        this._context = context;
        const dataBuffer = this._context.bufferManager.createBuffer(size, flags | GPUBufferUsage.STORAGE);
        this._buffer = dataBuffer;
    }

    public getBuffer(): GPUDataBuffer {
        return this._buffer;
    }

    public update(data: DataArray, byteOffset?: number, byteLength?: number) {
        const dataBuffer = this._buffer;
        if (byteOffset === undefined) {
            byteOffset = 0;
        }

        let view: ArrayBufferView;
        if (byteLength === undefined) {
            if (data instanceof Array) {
                view = new Float32Array(data);
            }
            else if (data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
            }
            else {
                view = data;
            }
            byteLength = view.byteLength;
        } else {
            if (data instanceof Array) {
                view = new Float32Array(data);
            }
            else if (data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
            }
            else {
                view = data;
            }
        }

        this._context.bufferManager.setSubData(dataBuffer, byteOffset, view, 0, byteLength);
    }

    public read(offset?: number, size?: number, buffer?: ArrayBufferView): Promise<ArrayBufferView> {
        const storageBuffer = this._buffer;
        size = size || storageBuffer.capacity;

        const gpuBuffer = this._context.bufferManager.createRawBuffer(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);

        const encoder = this._context.commandEncoder;

        encoder.copyBufferToBuffer(
            storageBuffer.gpuBuffer,
            offset ?? 0,
            gpuBuffer,
            0,
            size
        );

        return new Promise((resolve, reject) => {
            this._context.onAfterSubmitObservers.addOnce(() => {
                gpuBuffer.mapAsync(GPUMapMode.READ, 0, size).then(() => {
                    const copyArrayBuffer = gpuBuffer.getMappedRange(0, size);
                    let data: ArrayBufferView | undefined = buffer;
                    if (data === undefined) {
                        data = new Uint8Array(size!);
                        (data as Uint8Array).set(new Uint8Array(copyArrayBuffer));
                    } else {
                        const ctor = data.constructor as any;
                        data = new ctor(data.buffer);
                        (data as any).set(new ctor(copyArrayBuffer));
                    }
                    gpuBuffer.unmap();
                    this._context.bufferManager.releaseBuffer(gpuBuffer);
                    resolve(data!);
                }, (reason) => reject(reason));
            });
        });
    }

    public dispose() {
        this._context.bufferManager.releaseBuffer(this._buffer);
        this._buffer = null as any;
    }
}
