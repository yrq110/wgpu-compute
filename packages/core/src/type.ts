export type ComputeBindingLocation = { group: number, binding: number };

export type ComputeBindingMapping = { [key: string]: ComputeBindingLocation };

export enum ComputeBindingType {
    Texture = 0,
    StorageTexture = 1,
    UniformBuffer = 2,
    StorageBuffer = 3,
    TextureWithoutSampler = 4,
    Sampler = 5,
}

export type ComputeBindingList = { [key: string]: { type: ComputeBindingType, object: any, indexInGroupEntries?: number } };