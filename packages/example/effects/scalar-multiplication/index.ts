import { ComputeContext, ComputeShader, StorageBuffer, UniformBuffer } from '@wgpu-compute/core';
// @ts-ignore
import shader from './shader.wgsl?raw';

export const createScalarMultiplicationEffect = (context: ComputeContext, a: ArrayLike<number>, b: number) => {
    const cs = new ComputeShader('vector-scalar', context, {
        source: shader,
        bindingMapping: {
            "inputVector": { group: 0, binding: 0 },
            "resultVector": { group: 0, binding: 1 },
            "scale": { group: 0, binding: 2 },
        }
    })

    const inputVector = new Float32Array(a);
    const inputBuffer = new StorageBuffer(inputVector.byteLength, context);
    inputBuffer.update(inputVector)
    cs.setStorageBuffer('inputVector', inputBuffer);

    const resultMatrixBufferSize = Float32Array.BYTES_PER_ELEMENT * inputVector.length;
    const resultBuffer = new StorageBuffer(resultMatrixBufferSize, context);
    cs.setStorageBuffer('resultVector', resultBuffer);

    const uniform = new Float32Array([b]);
    const uniformBuffer = new UniformBuffer(uniform, context);
    cs.setUniformBuffer('scale', uniformBuffer);

    cs.dispatch(inputVector.length, 1);

    return { computeShader: cs, resultBuffer };
}
