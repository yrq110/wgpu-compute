struct Vector {
    values: array<f32>;
};

struct Scale {
    value: f32;
};

[[group(0), binding(0)]] var<storage, read> inputVector : Vector;
[[group(0), binding(1)]] var<storage, write> resultVector : Vector;
[[group(0), binding(2)]] var<uniform> scale: Scale;

[[stage(compute), workgroup_size(1, 1)]]
fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    let index = u32(global_id.x);
    resultVector.values[index] = inputVector.values[index] * scale.value;
}
