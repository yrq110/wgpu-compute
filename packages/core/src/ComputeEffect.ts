export class ComputeEffect {
    public sources: { compute: string };
    
    public stage: GPUProgrammableStage;
    
    public pipeline: GPUComputePipeline;
    
    private _device: GPUDevice;

    public constructor(device: GPUDevice) {
        this._device = device;
    }

    public setEffect(code: string, defines: string = '', entryPoint: string = 'main') {
        this.stage  = this._createComputePipelineStage(code , defines, entryPoint);
        this.pipeline = this._device.createComputePipeline({ compute: this.stage})
    }

    private _createComputePipelineStage(computeShader: string, defines: string, entryPoint: string): GPUProgrammableStage {
        return {
            module: this._device.createShaderModule({
                code: defines + '\n' + computeShader,
            }),
            entryPoint
        };
    }
}
