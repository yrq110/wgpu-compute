import { GPUDataBuffer } from './Buffer';

export class BufferManager {
    private _device: GPUDevice;

    private _deferredReleaseBuffers: GPUBuffer[] = [];

    public static isGPUBuffer(buffer: GPUDataBuffer | GPUBuffer): buffer is GPUBuffer {
        return (buffer as GPUDataBuffer).gpuBuffer === undefined;
    }

    public constructor(device: GPUDevice) {
        this._device = device;
    }

    public createRawBuffer(viewOrSize: ArrayBufferView | number, flags: GPUBufferUsageFlags, mappedAtCreation = false): GPUBuffer {
        const alignedLength = (viewOrSize as ArrayBufferView).byteLength !== undefined ? ((viewOrSize as ArrayBufferView).byteLength + 3) & ~3 : ((viewOrSize as number) + 3) & ~3; // 4 bytes alignments
        const bufferDescriptor = {
            mappedAtCreation,
            size: alignedLength,
            usage: flags
        };

        return this._device.createBuffer(bufferDescriptor);
    }

    public createBuffer(viewOrSize: ArrayBufferView | number, flags: GPUBufferUsageFlags) {
        const isView = (viewOrSize as ArrayBufferView).byteLength !== undefined;
        const buffer = this.createRawBuffer(viewOrSize, flags);
        const dataBuffer = new GPUDataBuffer(buffer);
        dataBuffer.references = 1;
        dataBuffer.capacity = isView ? (viewOrSize as ArrayBufferView).byteLength : viewOrSize as number;

        if (isView) {
            this.setSubData(dataBuffer, 0, viewOrSize as ArrayBufferView);
        }

        return dataBuffer;
    }

    public setRawData(buffer: GPUBuffer, dstByteOffset: number, src: ArrayBufferView, srcByteOffset: number, byteLength: number): void {
        this._device.queue.writeBuffer(buffer, dstByteOffset, src.buffer, srcByteOffset, byteLength);
    }

    public setSubData(dataBuffer: GPUDataBuffer, dstByteOffset: number, src: ArrayBufferView, srcByteOffset = 0, byteLength = 0): void {
        const buffer = dataBuffer.gpuBuffer;

        byteLength = byteLength || src.byteLength;
        byteLength = Math.min(byteLength, dataBuffer.capacity - dstByteOffset);

        // After Migration to Canary
        let chunkStart = src.byteOffset + srcByteOffset;
        let chunkEnd = chunkStart + byteLength;

        // 4 bytes alignments for upload
        const alignedLength = (byteLength + 3) & ~3;
        if (alignedLength !== byteLength) {
            const tempView = new Uint8Array(src.buffer.slice(chunkStart, chunkEnd));
            src = new Uint8Array(alignedLength);
            (src as Uint8Array).set(tempView);
            srcByteOffset = 0;
            chunkStart = 0;
            chunkEnd = alignedLength;
            byteLength = alignedLength;
        }

        // Chunk
        const maxChunk = 1024 * 1024 * 15;
        let offset = 0;
        while ((chunkEnd - (chunkStart + offset)) > maxChunk) {
            this._device.queue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, maxChunk);
            offset += maxChunk;
        }

        this._device.queue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, byteLength - offset);
    }

    public async readRawBuffer(gpuBuffer: GPUBuffer, size: number, offset: number = 0, buffer: Nullable<ArrayBufferView> = null, isFloat: boolean = false, destroyBuffer: boolean = true) {
        await gpuBuffer.mapAsync(GPUMapMode.READ, offset, size);
        const copyArrayBuffer = gpuBuffer.getMappedRange(offset, size);
        let data = buffer;
        if (data === null) {
            if (isFloat) {
                data = new Float32Array(size / 4);
                (data as Float32Array).set(new Float32Array(copyArrayBuffer));
            } else {
                data = new Uint8Array(size);
                (data as Uint8Array).set(new Uint8Array(copyArrayBuffer));
            }
        } else {
            if (isFloat) {
                data = new Float32Array(data.buffer);
                (data as Float32Array).set(new Float32Array(copyArrayBuffer));
            } else {
                data = new Uint8Array(data.buffer);
                (data as Uint8Array).set(new Uint8Array(copyArrayBuffer));
            }
        }
        gpuBuffer.unmap();
        if (destroyBuffer) {
            gpuBuffer.destroy();
        }
        return data!;
    }

    public async readBuffer(dataBuffer: GPUDataBuffer, buffer: Nullable<ArrayBufferView> = null, isFloat: boolean = false, destroyBuffer: boolean = false) {
        return await this.readRawBuffer(dataBuffer.gpuBuffer, dataBuffer.capacity, 0, buffer, isFloat, destroyBuffer);
    }

    public releaseBuffer(buffer: GPUDataBuffer | GPUBuffer): boolean {
        if (BufferManager.isGPUBuffer(buffer)) {
            this._deferredReleaseBuffers.push(buffer);
            return true;
        }

        buffer.references--;

        if (buffer.references === 0) {
            this._deferredReleaseBuffers.push(buffer.gpuBuffer as GPUBuffer);
            return true;
        }

        return false;
    }

    public destroyDeferredBuffers(): void {
        for (let i = 0; i < this._deferredReleaseBuffers.length; ++i) {
            this._deferredReleaseBuffers[i].destroy();
        }

        this._deferredReleaseBuffers.length = 0;
    }
}
