import { HardwareTexture } from "./HardwareTexture";
import { BufferManager } from "./BufferManager";

export class TextureHelper {
    private _device: GPUDevice;

    private _bufferManager: BufferManager;

    private _deferredReleaseTextures: Array<GPUTexture> = [];

    public static IsImageBitmap(imageBitmap: ImageBitmap | { width: number, height: number }): imageBitmap is ImageBitmap {
        return (imageBitmap as ImageBitmap).close !== undefined;
    }

    public constructor(device: GPUDevice, bufferManager: BufferManager) {
        this._device = device;
        this._bufferManager = bufferManager;
    }

    public createTexture(imageBitmap: ImageBitmap | { width: number, height: number, layers?: number }, premultiplyAlpha = false, is3D = false, format: GPUTextureFormat = 'rgba8unorm', usage = -1, additionalUsages = 0): HardwareTexture {

        const layerCount = (imageBitmap as any).layers || 1;
        let textureSize = {
            width: imageBitmap.width,
            height: imageBitmap.height,
            depthOrArrayLayers: layerCount,
        };

        const usages = usage >= 0 ? usage : GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING;

        const gpuTexture = this._device.createTexture({
            size: textureSize,
            dimension: is3D ? '3d' : '2d',
            format,
            usage: usages | additionalUsages,
        });

        if (TextureHelper.IsImageBitmap(imageBitmap)) {
            this.updateTexture(imageBitmap, gpuTexture, imageBitmap.width, imageBitmap.height, layerCount, format, premultiplyAlpha, 0, 0);
        }

        const texture = new HardwareTexture(gpuTexture);
        texture.createView({ format: format });

        return texture;
    }

    public updateTexture(
        imageBitmap: ImageBitmap | Uint8Array | HTMLCanvasElement | OffscreenCanvas,
        texture: GPUTexture,
        width: number, height: number, layers: number,
        format: GPUTextureFormat,
        premultiplyAlpha = false, offsetX = 0, offsetY = 0,
    ) {
        const gpuTexture = texture;

        const textureCopyView: GPUImageCopyTextureTagged = {
            texture: gpuTexture,
            origin: {
                x: offsetX,
                y: offsetY,
                z: 0
            },
            premultipliedAlpha: premultiplyAlpha,
        };

        const textureExtent = {
            width: width,
            height: height,
            depthOrArrayLayers: layers || 1
        };

        if ((imageBitmap as Uint8Array).byteLength !== undefined) {
            imageBitmap = imageBitmap as Uint8Array;
        } else {
            imageBitmap = imageBitmap as (ImageBitmap | HTMLCanvasElement | OffscreenCanvas);
            this._device.queue.copyExternalImageToTexture({ source: imageBitmap }, textureCopyView, textureExtent);
        }
    }

    public readPixels(texture: GPUTexture, x: number, y: number, width: number, height: number, format: GPUTextureFormat = 'rgba8unorm', faceIndex: number = 0, mipLevel: number = 0, buffer: Nullable<ArrayBufferView> = null) {

        const block = { width: 1, height: 1, length: 4 }; // for rgba8unorm
        
        const bytesPerRow = Math.ceil(width / block.width) * block.length;

        const bytesPerRowAligned = Math.ceil(bytesPerRow / 256) * 256;

        const size = bytesPerRowAligned * height;

        const gpuBuffer = this._bufferManager.createRawBuffer(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);

        const commandEncoder = this._device.createCommandEncoder({});

        commandEncoder.copyTextureToBuffer({
            texture,
            mipLevel,
            origin: {
                x,
                y,
                z: Math.max(faceIndex, 0)
            }
        }, {
            buffer: gpuBuffer,
            offset: 0,
            bytesPerRow: bytesPerRowAligned
        }, {
            width,
            height,
            depthOrArrayLayers: 1
        });

        this._device.queue.submit([commandEncoder!.finish()]);

        return this._bufferManager.readRawBuffer(gpuBuffer, size, 0, buffer);
    }

    public releaseTexture(texture: GPUTexture): void {
        this._deferredReleaseTextures.push(texture);
    }

    public destroyDeferredBuffers(): void {
        for (let i = 0; i < this._deferredReleaseTextures.length; ++i) {
            this._deferredReleaseTextures[i].destroy();
        }

        this._deferredReleaseTextures.length = 0;
    }
}
