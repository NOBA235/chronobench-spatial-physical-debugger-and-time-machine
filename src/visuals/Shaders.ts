import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three';

export function holoMaterial(hex: number): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uColor: { value: new Color(hex) }, uPower: { value: 2.5 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uPower; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
        gl_FragColor = vec4(uColor * (0.25 + f * 1.4), 0.35 + f * 0.6); }`,
  });
}

const VERT = `varying vec2 vUv; varying vec3 vP;
  void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** Anti-aliased tabletop grid (fwidth); freeze sends a gold chrono-wave outward from the centre. */
export function gridMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide, vertexShader: VERT,
    uniforms: { uTime: { value: 0 }, uFreeze: { value: 0 } },
    fragmentShader: `uniform float uTime; uniform float uFreeze; varying vec2 vUv;
      void main(){ vec2 c = vUv * 12.0; vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
        float l = 1.0 - min(min(g.x, g.y), 1.0);
        float w = uFreeze * exp(-pow((fract(length(vUv - 0.5) * 1.5 - uTime * 0.4) - 0.5) * 9.0, 2.0));
        vec3 col = mix(vec3(0.12, 0.8, 0.9), vec3(1.0, 0.76, 0.29), w);
        gl_FragColor = vec4(col, l * 0.7 + w * 0.35 + 0.03); }`,
  });
}

/** Animated crimson/amber plasma for pendulum bobs. */
export function plasmaMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, vertexShader: VERT,
    uniforms: { uTime: { value: 0 } },
    fragmentShader: `uniform float uTime; varying vec3 vP;
      void main(){ float n = sin(vP.x * 60.0 + uTime * 4.0) * sin(vP.y * 60.0 - uTime * 3.0) * sin(vP.z * 60.0 + uTime * 2.0);
        vec3 col = mix(vec3(1.0, 0.18, 0.28), vec3(1.0, 0.65, 0.2), n * 0.5 + 0.5);
        gl_FragColor = vec4(col * (0.7 + 0.6 * n), 0.85); }`,
  });
}

/** Boundary ring; hue is set from timeScale in JS (indigo frozen, cyan rewind, gold forward). */
export function freezeFieldMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, vertexShader: VERT,
    uniforms: { uTime: { value: 0 }, uColor: { value: new Color(0xffc24a) } },
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec3 vP;
      void main(){ gl_FragColor = vec4(uColor, 0.45 + 0.35 * sin(atan(vP.y, vP.x) * 24.0 + uTime * 2.0)); }`,
  });
}
