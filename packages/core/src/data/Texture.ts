import { HardwareTexture } from "./HardwareTexture";
import { ComputeContext } from "../ComputeContext";
import { TextureHelper } from "./TextureHelper";

export class Texture {
  public hardwareTexture: HardwareTexture;

  private  _width: number;

  private  _height: number;
  
  private _context: ComputeContext;

  public constructor(imageBitmap: ImageBitmap | { width: number, height: number, layers?: number }, context: ComputeContext, isStorage: boolean = false, premultiplyAlpha = false, format: GPUTextureFormat = 'rgba8unorm') {
    this._context = context;
    const additionUsages = isStorage ? GPUTextureUsage.STORAGE_BINDING : 0;
      this._width = imageBitmap.width;
      this._height = imageBitmap.height;
    this.hardwareTexture =  context.textureHelper.createTexture(imageBitmap, premultiplyAlpha, false, format, GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING, additionUsages);
  }

  public get width() {
    return this._width;
  }

  public get height() {
    return this._height;
  }

  public readPixels() {
    return this._context.textureHelper.readPixels(this.hardwareTexture.gpuTexture, 0, 0, this._width, this._height);
  }
}

