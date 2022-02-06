import { ComputeContext, ComputeShader, Texture, UniformBuffer, StorageBuffer } from '@wgpu-compute/core';
// @ts-ignore
import shader from '../shader/blend_storage_texture.wgsl?raw';

export const storageTexture = async () => {
  const context = await ComputeContext.CreateAsync();
  const sizeW = 256;
  const sizeH = 128;

  const cs = new ComputeShader('texture', context, {
    source: shader,
    bindingMapping: {
      'target_texture': { group: 0, binding: 0 },
      'color_a': { group: 1, binding: 0 },
      'color_b': { group: 1, binding: 1 },
    }
  })
  const colorAUniform = new Float32Array([1.0, 0.0, 0.0]); // r, g, b
  const colorAUniformBuffer = new UniformBuffer(colorAUniform, context);
  cs.setUniformBuffer('color_a', colorAUniformBuffer);
  const colorBUniform = new Float32Array([0.0, 1.0, 0.0]); // r, g, b
  const colorBUniformBuffer = new UniformBuffer(colorBUniform, context);
  cs.setUniformBuffer('color_b', colorBUniformBuffer);

  const texture = new Texture({ width: sizeW, height: sizeH }, context, true);
  cs.setStorageTexture('target_texture', texture);

  cs.dispatch(sizeW, sizeH);

  context.submit();

  const res = await texture.readPixels();
  const array = new Uint8ClampedArray(res.buffer);

  const canvas = document.querySelector('.container') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const imageData = new ImageData(array, sizeW, sizeH);
  ctx.putImageData(imageData, 0, 0);
}
