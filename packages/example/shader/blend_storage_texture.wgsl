[[group(0), binding(0)]] var target_texture : texture_storage_2d<rgba8unorm,write>;

struct Color {
  value: vec3<f32>;
};
[[group(1), binding(0)]] var<uniform> color_a: Color;
[[group(1), binding(1)]] var<uniform> color_b: Color;

[[stage(compute), workgroup_size(1, 1)]]
fn main(
  [[builtin(global_invocation_id)]] global_id: vec3<u32>, 
  [[builtin(num_workgroups)]] num_workgroups: vec3<u32>
) {
  var color_a_value = f32(global_id.x) / f32(num_workgroups.x) * color_a.value.xyz;
  var color_b_value = f32(global_id.y) / f32(num_workgroups.y) * color_b.value.xyz;
  textureStore(
    target_texture,
    vec2<i32>(global_id.xy), 
    vec4<f32>(color_a_value + color_b_value, 1.0)
  );
}
