import { ComputeContext } from '@wgpu-compute/core';
import { createMatrixMultiplicationEffect } from '../effects/matrix-multiplication';

export const SeparateSubmitAndRead = async () => {
    console.log('WebGPU Compute Example - ', 'SeparateSubmitAndRead');

    const context = await ComputeContext.CreateAsync();

    /* simulate a submit calling, may be executed in other place */
	setTimeout(() => {
        context.submit();
    }, 100);

    const { resultBuffer } = createMatrixMultiplicationEffect(context, [
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

    const res = await resultBuffer.read();
    const result = new Float32Array(res.buffer);
    console.log('result matrix: ', result);
}

export const SequenceSubmitAndRead = async () => {
    console.log('WebGPU Compute Example - ', 'SequenceSubmitAndRead');

    const context = await ComputeContext.CreateAsync();
    
    const { resultBuffer } = createMatrixMultiplicationEffect(context, [
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

    /* record read command and get result after submitting*/
    const resPromise = resultBuffer.read();

    context.submit();

    const res = await resPromise;
    const array = new Float32Array(res.buffer);

    console.log('result matrix: ', array);
}
