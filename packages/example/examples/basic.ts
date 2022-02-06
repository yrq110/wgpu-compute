import { ComputeContext, ComputeShader, StorageBuffer } from '@wgpu-compute/core';
// @ts-ignore
import shader from '../shader/matrix_multiplication.wgsl?raw';

export const BasicUsage = async () => {
	console.log('WebGPU Compute Example - ', 'BasicUsage');

	const context = await ComputeContext.CreateAsync();
	const cs = new ComputeShader('matrix', context, {
		source: shader,
		bindingMapping: {
			"firstMatrix": { group: 0, binding: 0 },
			"secondMatrix": { group: 0, binding: 1 },
			"resultMatrix": { group: 0, binding: 2 },
		}
	});

	const firstMatrix = new Float32Array([
		2 /* rows */, 4 /* columns */,
		1, 2, 3, 4,
		5, 6, 7, 8
	]);
	const firstBuffer = new StorageBuffer(firstMatrix.byteLength, context);
	firstBuffer.update(firstMatrix);
	cs.setStorageBuffer('firstMatrix', firstBuffer);

	const secondMatrix = new Float32Array([
		4 /* rows */, 2 /* columns */,
		1, 2,
		3, 4,
		5, 6,
		7, 8
	]);
	const secondBuffer = new StorageBuffer(secondMatrix.byteLength, context);
	secondBuffer.update(secondMatrix);
	cs.setStorageBuffer('secondMatrix', secondBuffer);

	const resultMatrixBufferSize = Float32Array.BYTES_PER_ELEMENT * (2 + firstMatrix[0] * secondMatrix[1]);
	const resultBuffer = new StorageBuffer(resultMatrixBufferSize, context);
	cs.setStorageBuffer('resultMatrix', resultBuffer);

	cs.dispatch(firstMatrix[0], secondMatrix[1]);

	/* return a promise directly */
	/* record read command and get res after submit*/
	const resPromise = resultBuffer.read();

	context.submit();

	const res = await resPromise;
	const array = new Float32Array(res.buffer);

	console.log('result matrix: ', array);
}
