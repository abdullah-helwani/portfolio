"use client";

// Adapted from 21st.dev — isaiahbjork/shader-aurora-veil.
// Single-draw WebGL aurora. Pauses off-screen, freezes under reduced motion,
// and falls back to a CSS gradient when WebGL is unavailable.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

float saturate(float v) { return clamp(v, 0.0, 1.0); }

mat2 rotate2d(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = rotate2d(0.72) * p * 2.03 + 4.17;
    amplitude *= 0.5;
  }
  return value;
}

vec3 shaderColor(vec2 uv, vec2 p, float t, float intensity) {
  vec2 q = p;
  q.x += sin(q.y * 2.0 + t * 0.18) * 0.22;
  q.y += cos(q.x * 1.7 - t * 0.14) * 0.16;
  q += (fbm(q * 1.2 + t * 0.05) - 0.5) * 0.35;

  float veilA = smoothstep(0.72, 0.04, abs(q.y - 0.18 + sin(q.x * 1.8 + t * 0.24) * 0.32));
  float veilB = smoothstep(0.62, 0.02, abs(q.y * 0.85 + 0.32 - cos(q.x * 2.4 - t * 0.2) * 0.24));
  float veilC = smoothstep(0.9, 0.0, abs(q.y + 0.55 + sin(q.x * 1.1 - t * 0.11) * 0.4));
  float grain = fbm(q * 2.5 + t * 0.04);

  vec3 base = vec3(0.035, 0.043, 0.047);
  vec3 teal = vec3(0.26, 0.80, 0.71);
  vec3 ember = vec3(0.95, 0.40, 0.16);
  vec3 indigo = vec3(0.16, 0.22, 0.42);

  vec3 color = base;
  color += teal * veilA * 0.5;
  color += ember * veilB * 0.26;
  color += indigo * veilC * 0.35;
  color += (grain - 0.5) * 0.04;

  // vignette keeps the edges calm so copy stays readable
  float vignette = smoothstep(1.35, 0.25, length(p * vec2(0.8, 1.0)));
  color *= mix(0.55, 1.0, vignette);

  return color * (0.84 + intensity * 0.22);
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(u_resolution.xy, vec2(1.0));
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / max(min(u_resolution.x, u_resolution.y), 1.0);
  vec3 color = shaderColor(uv, p, u_time, u_intensity);
  color = pow(max(color, vec3(0.0)), vec3(0.92));
  gl_FragColor = vec4(color, 1.0);
}
`;

const fallbackBackground =
  "radial-gradient(circle at 30% 30%, rgba(66,204,181,0.38), transparent 38%), radial-gradient(circle at 78% 70%, rgba(242,102,41,0.22), transparent 36%), radial-gradient(circle at 50% 100%, rgba(41,56,107,0.4), transparent 50%), #090b0c";

export interface AuroraVeilProps {
  className?: string;
  intensity?: number;
  maxPixelRatio?: number;
  maxCanvasPixels?: number;
  children?: ReactNode;
}

export function AuroraVeil({
  className,
  intensity = 1,
  maxPixelRatio = 1.35,
  maxCanvasPixels = 620_000,
  children,
}: AuroraVeilProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [contextEpoch, setContextEpoch] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let visible = true;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setReady(false);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const handleContextRestored = () => setContextEpoch((v) => v + 1);

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    const cleanup = () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
      }
    };

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
        stencil: false,
      });
      if (!gl) return cleanup;

      program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
      buffer = gl.createBuffer();
      if (!program || !buffer) return cleanup;

      const positionLocation = gl.getAttribLocation(program, "a_position");
      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      const timeLocation = gl.getUniformLocation(program, "u_time");
      const intensityLocation = gl.getUniformLocation(program, "u_intensity");

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const animate = !shouldReduceMotion;

      const resize = () => {
        if (!gl) return;
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
        let width = Math.max(1, Math.floor(rect.width * ratio));
        let height = Math.max(1, Math.floor(rect.height * ratio));
        const pixels = width * height;
        if (pixels > maxCanvasPixels) {
          const scale = Math.sqrt(maxCanvasPixels / pixels);
          width = Math.max(1, Math.floor(width * scale));
          height = Math.max(1, Math.floor(height * scale));
        }
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        gl.viewport(0, 0, width, height);
      };

      const render = (now: number) => {
        if (!gl || !program || disposed) return;
        resize();
        gl.useProgram(program);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(timeLocation, animate ? now * 0.001 : 18.0);
        gl.uniform1f(intensityLocation, intensity);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const tick = (now: number) => {
        if (disposed || !visible) {
          frame = 0;
          return;
        }
        render(now);
        frame = requestAnimationFrame(tick);
      };

      const start = () => {
        if (frame || disposed) return;
        frame = requestAnimationFrame(tick);
      };

      resizeObserver = new ResizeObserver(() => render(performance.now()));
      resizeObserver.observe(canvas);

      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          visible = Boolean(entry?.isIntersecting);
          if (visible && animate) {
            start();
            return;
          }
          if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
          }
          if (visible) render(performance.now());
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(canvas);

      render(performance.now());
      requestAnimationFrame(() => {
        if (!disposed) setReady(true);
      });
      if (animate) start();
    } catch {
      // WebGL unavailable: the CSS gradient fallback stays visible.
    }

    return cleanup;
  }, [contextEpoch, intensity, maxCanvasPixels, maxPixelRatio, shouldReduceMotion]);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: fallbackBackground }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-1000",
          ready ? "opacity-100" : "opacity-0",
        )}
      />
      {children}
    </div>
  );
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
