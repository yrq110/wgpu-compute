# wgpu-compute

An **experimental library** for easier using WebGPU compute shader.

## Scripts

Install library
```bash
# use pnpm
pnpm add @wgpu-compute/core
# or use yarn
yarn add @wgpu-compute/core
```

Development
```bash
# install deps
pnpm install
# run example
pnpm run dev --filter example 
```

## Quick Start

Let's do a matrix multiplication:

1. create a compute context
   ```ts
   import { ComputeContext, ComputeShader, StorageBuffer } from '@wgpu-compute/core';

   const context = await ComputeContext.CreateAsync();
   ```

2. load source shader and declare bindGroup layout which used in the shader
   ```ts
   const cs = new ComputeShader('matrix', context, {
     source: shader,
     bindingMapping: {
       "firstMatrix": { group: 0, binding: 0 },
       "secondMatrix": { group: 0, binding: 1 },
       "resultMatrix": { group: 0, binding: 2 },
     }
   });
   ```

   and the shader may be like (in WGSL):

   ```wgsl
   struct Matrix {
       size : vec2<f32>;
       numbers: array<f32>;
   };

   [[group(0), binding(0)]] var<storage, read> firstMatrix : Matrix;
   [[group(0), binding(1)]] var<storage, read> secondMatrix : Matrix;
   [[group(0), binding(2)]] var<storage, write> resultMatrix : Matrix;

   [[stage(compute), workgroup_size(1, 1)]]
   fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
       resultMatrix.size = vec2<f32>(firstMatrix.size.x, secondMatrix.size.y);

       let resultCell = vec2<u32>(global_id.x, global_id.y);
       var result = 0.0;
       for (var i = 0u; i < u32(firstMatrix.size.y); i = i + 1u) {
           let a = i + resultCell.x * u32(firstMatrix.size.y);
           let b = resultCell.y + i * u32(secondMatrix.size.y);
           result = result + firstMatrix.numbers[a] * secondMatrix.numbers[b];
       }
       
       let index = resultCell.y + resultCell.x * u32(secondMatrix.size.y);
       resultMatrix.numbers[index] = result;
   }

   ```

3. create required storage or uniform buffer in the shader, including source and target buffer
   ```ts
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
   ```

4. dispatch compute shader task
   ```ts
   cs.dispatch(firstMatrix[0], secondMatrix[1]);
   ```

5. submit commands and get result
   ```ts
   const resPromise = resultBuffer.read();

   context.submit();

   const res = await resPromise;
   const array = new Float32Array(res.buffer);

   console.log('result matrix: ', array);
   ```

## Foundamental

also the main classes in `packages/core` path:

* ComputeContext
* ComputeEffect
* ComputeShader
* ComputeBindGroup
* StorageBuffer
* UniformBuffer
* Texture

## Examples

examples in `packages/example` path: 

* Vanila WebGPU Compute Shader
* Basic Storage and Uniform Buffer
* Basic Storage Texture
* Compute Effect Encapsulation

## Refs

* [WebGPU](https://www.w3.org/TR/webgpu/)
* [WebGPU Shading Language](https://www.w3.org/TR/WGSL/)
* [WebGPU Samples](https://austin-eng.com/webgpu-samples)
* [Get started with GPU Compute on the web](https://web.dev/gpu-compute/)
* [Babylon.js WebGPU Compute Shader Playground](https://playground.babylonjs.com/?webgpu#3URR7V#115)
