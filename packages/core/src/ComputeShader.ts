import { ComputeBindingList, ComputeBindingMapping, ComputeBindingType } from "./type";
import { ComputeBindGroups } from "./ComputeBindGroups";
import { StorageBuffer } from './data/StorageBuffer';
import { UniformBuffer } from './data/UniformBuffer';
import { ComputeContext } from "./ComputeContext";
import { ComputeEffect } from './ComputeEffect';
import { Texture } from './data/Texture';

export type ComputeShaderOptions = {
    source: string;
    bindingMapping: ComputeBindingMapping;
    defines?: string;
    entryPoints?: string;
}

export class ComputeShader {
    public name: string;

    public device: GPUDevice;

    public context: ComputeContext;

    public bindGroups: ComputeBindGroups;

    public effect: ComputeEffect;

    private _options: ComputeShaderOptions;

    private _bindings: ComputeBindingList;

    public constructor(name: string, context: ComputeContext, options: ComputeShaderOptions) {
        this.name = name;
        this.context = context;
        this._bindings = {};
        this._options = options;
        this.device = context.device;
        this.effect = new ComputeEffect(this.device);
        this.bindGroups = new ComputeBindGroups(this.device);
        const { source, defines, entryPoints } = options;
        this.effect.setEffect(source, defines ?? '', entryPoints ?? 'main');
    }

    public setTexture(name: string, texture: Texture, bindSampler = true) {
        if (this._bindings[name]) {
            this._bindings[name].object = texture;
            return
        }
        this._bindings[name] = {
            type: bindSampler ? ComputeBindingType.Texture : ComputeBindingType.TextureWithoutSampler,
            object: texture,
        };
    }

    public setStorageTexture(name: string, texture: Texture) {
        if (this._bindings[name]) {
            this._bindings[name].object = texture;
            return
        }
        this._bindings[name] = {
            type: ComputeBindingType.StorageTexture,
            object: texture,
        };
    }

    public setStorageBuffer(name: string, buffer: StorageBuffer) {
        if (this._bindings[name]) {
            this._bindings[name].object = buffer;
            return
        }

        this._bindings[name] = {
            type: ComputeBindingType.StorageBuffer,
            object: buffer,
        };
    }

    public setUniformBuffer(name: string, buffer: UniformBuffer) {
        if (this._bindings[name]) {
            this._bindings[name].object = buffer;
            return
        }

        this._bindings[name] = {
            type: ComputeBindingType.UniformBuffer,
            object: buffer,
        }
    }

    public dispatch(x: number, y?: number, z?: number) {
        const computePipeline = this.effect.pipeline;

        const commandEncoder = this.context.commandEncoder;

        const computePass = commandEncoder.beginComputePass();

        computePass.setPipeline(computePipeline);

        const bindGroups = this.bindGroups.getBindGroups(this._bindings, computePipeline, this._options.bindingMapping);

        for (let i = 0; i < bindGroups.length; ++i) {
            const bindGroup = bindGroups[i];
            if (!bindGroup) {
                continue;
            }
            computePass.setBindGroup(i, bindGroup);
        }

        computePass.dispatch(x, y, z);
        computePass.endPass();
    }
}
