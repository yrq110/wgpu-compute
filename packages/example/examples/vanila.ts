import { ComputeContext } from '@wgpu-compute/core';
// @ts-ignore
import shader from '../shader/matrix_multiplication.wgsl?raw';

// Resource: https://web.dev/gpu-compute/
export const VanilaUsage= async () => {
	console.log('WebGPU Compute Example - ', 'VanilaUsage');

	const engine = await ComputeContext.CreateAsync();
	
	const device = engine.device;

	// First Matrix
	const firstMatrix = new Float32Array([
		2 /* rows */, 4 /* columns */,
		1, 2, 3, 4,
		5, 6, 7, 8
	]);

	const gpuBufferFirstMatrix = device.createBuffer({
		mappedAtCreation: true,
		size: firstMatrix.byteLength,
		usage: GPUBufferUsage.STORAGE
	});
	const arrayBufferFirstMatrix = gpuBufferFirstMatrix.getMappedRange();

	new Float32Array(arrayBufferFirstMatrix).set(firstMatrix);
	gpuBufferFirstMatrix.unmap();


	// Second Matrix
	const secondMatrix = new Float32Array([
		4 /* rows */, 2 /* columns */,
		1, 2,
		3, 4,
		5, 6,
		7, 8
	]);

	const gpuBufferSecondMatrix = device.createBuffer({
		mappedAtCreation: true,
		size: secondMatrix.byteLength,
		usage: GPUBufferUsage.STORAGE
	});
	const arrayBufferSecondMatrix = gpuBufferSecondMatrix.getMappedRange();
	new Float32Array(arrayBufferSecondMatrix).set(secondMatrix);
	gpuBufferSecondMatrix.unmap();


	// Result Matrix
	const resultMatrixBufferSize = Float32Array.BYTES_PER_ELEMENT * (2 + firstMatrix[0] * secondMatrix[1]);
	const resultMatrixBuffer = device.createBuffer({
		size: resultMatrixBufferSize,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
	});


	// Compute shader code
	const shaderModule = device.createShaderModule({ code: shader });

	// Pipeline setup
	const computePipeline = device.createComputePipeline({
		compute: {
			module: shaderModule,
			entryPoint: "main"
		}
	});


	// Bind group
	const bindGroup = device.createBindGroup({
		layout: computePipeline.getBindGroupLayout(0 /* index */),
		entries: [
			{
				binding: 0,
				resource: {
					buffer: gpuBufferFirstMatrix
				}
			},
			{
				binding: 1,
				resource: {
					buffer: gpuBufferSecondMatrix
				}
			},
			{
				binding: 2,
				resource: {
					buffer: resultMatrixBuffer
				}
			}
		]
	});

	// Commands submission
	const commandEncoder = device.createCommandEncoder();

	const passEncoder = commandEncoder.beginComputePass();
	passEncoder.setPipeline(computePipeline);
	passEncoder.setBindGroup(0, bindGroup);
	passEncoder.dispatch(firstMatrix[0], secondMatrix[1]);
	passEncoder.endPass();

	// Get a GPU buffer for reading in an unmapped state.
	const gpuReadBuffer = device.createBuffer({
		size: resultMatrixBufferSize,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
	});

	// Encode commands for copying buffer to buffer.
	commandEncoder.copyBufferToBuffer(
		resultMatrixBuffer /* source buffer */,
		0 /* source offset */,
		gpuReadBuffer /* destination buffer */,
		0 /* destination offset */,
		resultMatrixBufferSize /* size */
	);

	// Submit GPU commands.
	const gpuCommands = commandEncoder.finish();
	device.queue.submit([gpuCommands]);


	// Read buffer.
	await gpuReadBuffer.mapAsync(GPUMapMode.READ);
	const arrayBuffer = gpuReadBuffer.getMappedRange();
	const res = new Float32Array(arrayBuffer);
	return res;
}