import { ComputeContext } from "../ComputeContext";
import { GPUDataBuffer } from "./Buffer";

export class UniformBuffer {
    private _context: ComputeContext;

    private _buffer: GPUDataBuffer;

    public constructor(elements: FloatArray, context: ComputeContext) {
        this._context = context;

        let view: Float32Array;
        if (elements instanceof Array) {
            view = new Float32Array(elements);
        }
        else {
            view = elements;
        }

        const dataBuffer = this._context.bufferManager.createBuffer(view, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
        this._buffer = dataBuffer;
    }

    public getBuffer(): GPUDataBuffer {
        return this._buffer;
    }

    public update(elements: FloatArray, offset?: number, count?: number) {
        if (offset === undefined) {
            offset = 0;
        }

        const dataBuffer = this._buffer;
        let view: Float32Array;
        if (count === undefined) {
            if (elements instanceof Float32Array) {
                view = elements;
            } else {
                view = new Float32Array(elements);
            }
            count = view.byteLength;
        } else {
            if (elements instanceof Float32Array) {
                view = elements;
            } else {
                view = new Float32Array(elements);
            }
        }

        this._context.bufferManager.setSubData(dataBuffer, offset, view, 0, count);
    }

    public dispose() {
        this._context.bufferManager.releaseBuffer(this._buffer);
        this._buffer = null as any;
    }
}

