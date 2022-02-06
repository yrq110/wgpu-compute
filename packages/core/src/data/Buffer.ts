export class GPUDataBuffer {
    public static count: number = 0;

    public readonly id: number;

    public references: number;

    public capacity: number

    private _buffer: GPUBuffer;

    public constructor(resource: GPUBuffer) {
        this.id = GPUDataBuffer.count++;
        this._buffer = resource;
    }

    public get gpuBuffer() {
        return this._buffer;
    }
}
