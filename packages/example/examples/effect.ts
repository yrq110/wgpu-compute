import { ComputeContext } from '@wgpu-compute/core';
import { createMatrixMultiplicationEffect } from '../effects/matrix-multiplication';
import { createScalarMultiplicationEffect } from '../effects/scalar-multiplication';
import { logBufferData } from '../utils/helper';

export const EffectsWithOneContext = async () => {
    console.log('WebGPU Compute Example - ', 'EffectsWithOneContext');

    const context = await ComputeContext.CreateAsync();

    setTimeout(() => {
        context.submit();
    }, 1000);

    const { resultBuffer: matrixResult } = createMatrixMultiplicationEffect(context, [
        2 /* rows */, 4 /* columns */,
        1, 2, 3, 4,
        5, 6, 7, 8
    ], [
        4 /* rows */, 2 /* columns */,
        1, 2,
        3, 4,
        5, 6,
        7, 8
    ]);
    logBufferData(matrixResult);

    const createIncreaseArray = (len: number) => new Array(len).fill(null).map((_, i) => i);
    const { resultBuffer: vectorResult } = createScalarMultiplicationEffect(context, createIncreaseArray(100), 2);
    logBufferData(vectorResult);
}
