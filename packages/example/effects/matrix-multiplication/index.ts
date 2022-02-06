import { ComputeContext, ComputeShader, StorageBuffer } from '@wgpu-compute/core';
// @ts-ignore
import shader from './shader.wgsl?raw';

export const createMatrixMultiplicationEffect = (context: ComputeContext, a: ArrayLike<number>, b: ArrayLike<number>) => {
    const cs = new ComputeShader('matrix-multiply', context, {
        source: shader,
        bindingMapping: {
            "firstMatrix": { group: 0, binding: 0 },
            "secondMatrix": { group: 0, binding: 1 },
            "resultMatrix": { group: 0, binding: 2 },
        }
    })

    const firstMatrix = new Float32Array(a);
    const firstBuffer = new StorageBuffer(firstMatrix.byteLength, context);
    firstBuffer.update(firstMatrix)
    cs.setStorageBuffer('firstMatrix', firstBuffer);

    const secondMatrix = new Float32Array(b);
    const secondBuffer = new StorageBuffer(secondMatrix.byteLength, context);
    secondBuffer.update(secondMatrix);
    cs.setStorageBuffer('secondMatrix', secondBuffer);

    const resultMatrixBufferSize = Float32Array.BYTES_PER_ELEMENT * (2 + firstMatrix[0] * secondMatrix[1]);
    const resultBuffer = new StorageBuffer(resultMatrixBufferSize, context);
    cs.setStorageBuffer('resultMatrix', resultBuffer);

    cs.dispatch(firstMatrix[0], secondMatrix[1]);

    return { computeShader: cs, resultBuffer };
}
