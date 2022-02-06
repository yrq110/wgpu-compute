import { ComputeContext } from "../ComputeContext";

export class HardwareTexture {
    public view: Nullable<GPUTextureView>;
    
    public format: GPUTextureFormat = 'rgba8unorm';
    
    public textureUsages: number = 0;
    
    private _texture: GPUTexture;

    public constructor(texture: GPUTexture) {
        this._texture = texture;
        this.view = null;
    }
    
    public set(texture: GPUTexture) {
        this._texture = texture;
    }

    public createView(descriptor?: GPUTextureViewDescriptor) {
        this.view = this._texture.createView(descriptor);
    }

    public get gpuTexture() {
        return this._texture;
    }

    public release() {
        this._texture.destroy();
        // @ts-ignore
        this.view?.destroy();
    }
}
