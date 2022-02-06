import { StorageBuffer } from "@wgpu-compute/core";

export const logBufferData = (buffer: StorageBuffer) => {
    const resPromise = buffer.read();
    resPromise.then(res => {
        const array = new Float32Array(res.buffer);
        console.log('buffer: ', array);
    })
}
