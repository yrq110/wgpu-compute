import { ComputeBindingList, ComputeBindingMapping, ComputeBindingType } from './type';
import { StorageBuffer } from './data/StorageBuffer';
import { UniformBuffer } from './data/UniformBuffer';
import { Texture } from './data/Texture';

export class ComputeBindGroups {
    private _device: GPUDevice;

    private _bindGroups: GPUBindGroup[];

    private _bindGroupEntries: GPUBindGroupEntry[][];

    constructor(device: GPUDevice) {
        this._device = device;
        this._bindGroups = [];
        this._bindGroupEntries = [];
    }

    public getBindGroups(bindings: ComputeBindingList, computePipeline: GPUComputePipeline, bindingsMapping: ComputeBindingMapping): GPUBindGroup[] {
        const bindGroups = this._bindGroups;
        for (const key in bindings) {
            const binding = bindings[key],
                location = bindingsMapping[key],
                group = location.group,
                index = location.binding,
                type = binding.type,
                object = binding.object;
            let entries = this._bindGroupEntries[group];
            if (!entries) {
                entries = this._bindGroupEntries[group] = [];
            }

            switch (type) {
                case ComputeBindingType.Texture:
                case ComputeBindingType.StorageTexture: {
                    const texture = object as Texture;
                    entries.push({
                        binding: index,
                        resource: texture.hardwareTexture.view!
                    })
                    break;
                }
                case ComputeBindingType.UniformBuffer:
                case ComputeBindingType.StorageBuffer: {
                    const buffer = type === ComputeBindingType.UniformBuffer ? object as UniformBuffer : object as StorageBuffer;
                    const dataBuffer = buffer.getBuffer();
                    const gpuBuffer = dataBuffer.gpuBuffer;
                    entries.push({
                        binding: index,
                        resource: {
                            buffer: gpuBuffer,
                            offset: 0,
                            size: dataBuffer.capacity
                        }
                    });
                    break;
                }
            }
        }

        for (let i = 0; i < this._bindGroupEntries.length; ++i) {
            const entries = this._bindGroupEntries[i];
            if (!entries) {
                this._bindGroups[i] = undefined as any;
                continue;
            }
            this._bindGroups[i] = this._device.createBindGroup({
                layout: computePipeline.getBindGroupLayout(i),
                entries,
            });
        }
        this._bindGroups.length = this._bindGroupEntries.length;
        return bindGroups;
    }

    public clear() {
        this._bindGroups = [];
    }
}