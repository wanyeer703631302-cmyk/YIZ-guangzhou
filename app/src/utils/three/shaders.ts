/**
 * 扭曲效果着色器
 * 应用径向扭曲和暗角效果
 */
export const DistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    distortion: { value: 0.0 }
  },
  
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float distortion;
    varying vec2 vUv;
    
    void main() {
      // 计算从中心的距离
      vec2 center = vec2(0.5);
      vec2 uv = vUv - center;
      float dist = length(uv);
      
      // 应用径向扭曲
      float distortionFactor = 1.0 + distortion * dist * dist * 2.5;
      vec2 distortedUv = center + uv * distortionFactor;
      
      // 采样纹理
      vec3 color = texture2D(tDiffuse, distortedUv).rgb;
      
      // 应用暗角效果
      float vignetteX = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
      float vignetteY = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
      float vignette = vignetteX * vignetteY;
      vignette = vignette * vignette;
      
      color *= vignette;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};
