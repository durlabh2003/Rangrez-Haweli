import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowRight, Footprints } from 'lucide-react';
import {
  HAWA_MAHAL_CHAMBERS,
  TIME_LIGHTING_MOODS,
  type ChamberId,
  type TimeOfDayId,
} from '../three/hawaMahalArchitecture';
import {
  createSoftParticleTexture,
  createSunbeamTexture,
} from '../three/hawaMahalTextures';

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const probeGl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!probeGl) return true;
    const dbg = probeGl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg ? String(probeGl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    probeGl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

const ARC_RADIUS = 26;
const ARC_THETA = 2.1;
const ARC_HEIGHT = ARC_RADIUS * ARC_THETA * (9 / 16);

function uvToArcWorld(u: number, v: number, target: THREE.Vector3): THREE.Vector3 {
  const theta = Math.PI + (0.5 - u) * ARC_THETA;
  const r = ARC_RADIUS - 0.8;
  target.set(Math.sin(theta) * r, (v - 0.5) * ARC_HEIGHT, Math.cos(theta) * r);
  return target;
}

const DOME_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DOME_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;
  uniform vec2 uPortalUv;
  uniform vec3 uTint;
  uniform float uBrightness;
  uniform float uNightFactor;

  varying vec2 vUv;

  void main() {
    vec2 baseUv = vec2(1.0 - vUv.x, vUv.y);
    float p = clamp(uMix, 0.0, 1.0);
    float ease = p * p * (3.0 - 2.0 * p);

    vec2 uvA = mix(baseUv, uPortalUv, ease * 0.42);
    vec2 uvB = mix(baseUv, vec2(0.5, 0.5), (1.0 - ease) * 0.16);

    vec4 colA = texture2D(uTexA, clamp(uvA, 0.002, 0.998));
    vec4 colB = texture2D(uTexB, clamp(uvB, 0.002, 0.998));
    vec3 color = mix(colA.rgb, colB.rgb, ease);

    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 graded = color * uTint * uBrightness;

    vec3 nightLit = graded * vec3(0.75, 0.82, 1.15);
    float archGlow = smoothstep(0.32, 0.88, luma) * uNightFactor;
    nightLit += vec3(1.0, 0.68, 0.30) * archGlow * 0.65;
    color = mix(graded, nightLit, uNightFactor);

    float portalGlow = sin(ease * 3.14159265) * 0.14;
    color += vec3(1.0, 0.84, 0.62) * portalGlow;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function HawaMahalWalkthroughCanvas({
  theme,
  onUnavailable,
}: {
  theme: 'dhoop' | 'raat';
  onUnavailable: () => void;
}) {
  const [activeChamberId, setActiveChamberId] = useState<ChamberId>('facade-gate');
  const [isDragging, setIsDragging] = useState(false);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const portalMarkerARef = useRef<HTMLButtonElement | null>(null);
  const portalMarkerBRef = useRef<HTMLButtonElement | null>(null);

  const activeChamberRef = useRef<ChamberId>('facade-gate');
  const timeRef = useRef<TimeOfDayId>(theme === 'raat' ? 'night' : 'noon');
  const breezeRef = useRef<number>(16);
  const isVisibleRef = useRef<boolean>(true);
  const texturesMapRef = useRef<Map<ChamberId, THREE.Texture>>(new Map());
  const domeUniformsRef = useRef<{
    uTexA: { value: THREE.Texture | null };
    uTexB: { value: THREE.Texture | null };
    uMix: { value: number };
    uPortalUv: { value: THREE.Vector2 };
    uTint: { value: THREE.Color };
    uBrightness: { value: number };
    uNightFactor: { value: number };
  } | null>(null);

  const transitionRef = useRef<{
    active: boolean;
    progress: number;
    fromId: ChamberId;
    toId: ChamberId;
  }>({
    active: false,
    progress: 0,
    fromId: 'facade-gate',
    toId: 'facade-gate',
  });

  const lookRef = useRef({
    yaw: 0,
    pitch: -0.035,
    targetYaw: 0,
    targetPitch: -0.035,
    fov: 52,
    targetFov: 52,
    stepZ: 0,
    targetStepZ: 0,
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const dragStateRef = useRef<{
    down: boolean;
    lastX: number;
    lastY: number;
    startX: number;
    startY: number;
    pointerType: string;
    mode: 'pending' | 'pan' | 'scroll';
  }>({
    down: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    pointerType: 'mouse',
    mode: 'pending',
  });

  useEffect(() => {
    timeRef.current = theme === 'raat' ? 'night' : 'noon';
  }, [theme]);

  const enterChamber = useCallback(
    (targetId: ChamberId, portalUv?: { u: number; v: number }) => {
      if (targetId === activeChamberRef.current && !transitionRef.current.active) return;
      const nextChamber =
        HAWA_MAHAL_CHAMBERS.find((c) => c.id === targetId) ?? HAWA_MAHAL_CHAMBERS[0];
      const currentSpec =
        HAWA_MAHAL_CHAMBERS.find((c) => c.id === activeChamberRef.current) ?? HAWA_MAHAL_CHAMBERS[0];

      const texA = texturesMapRef.current.get(activeChamberRef.current);
      const texB = texturesMapRef.current.get(targetId);

      if (domeUniformsRef.current && texA && texB) {
        domeUniformsRef.current.uTexA.value = texA;
        domeUniformsRef.current.uTexB.value = texB;
        domeUniformsRef.current.uMix.value = 0;

        const pUv = portalUv ?? currentSpec.forwardPortal ?? { u: 0.5, v: 0.45 };
        domeUniformsRef.current.uPortalUv.value.set(pUv.u, pUv.v);

        transitionRef.current = {
          active: true,
          progress: 0,
          fromId: activeChamberRef.current,
          toId: targetId,
        };
      }

      activeChamberRef.current = targetId;
      setActiveChamberId(targetId);

      lookRef.current.targetYaw = nextChamber.initialYaw;
      lookRef.current.targetPitch = nextChamber.initialPitch;
      lookRef.current.targetFov = 52;
      lookRef.current.targetStepZ = 0;
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      keysRef.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const testCanvas = document.createElement('canvas');
    if (!testCanvas.getContext('webgl2') && !testCanvas.getContext('webgl')) {
      onUnavailable();
      return;
    }

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      onUnavailable();
      return;
    }

    // WebGL Hygiene: DPR capped at 1.5 mobile / 2 desktop
    const isMobileViewport = window.innerWidth < 768;
    const dprCap = isMobileViewport ? 1.5 : 2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f110d);

    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      120
    );

    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const loader = new THREE.TextureLoader();
    const loadedTextures: THREE.Texture[] = [];
    HAWA_MAHAL_CHAMBERS.forEach((ch) => {
      const tex = loader.load(ch.imageUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      texturesMapRef.current.set(ch.id, tex);
      loadedTextures.push(tex);
    });

    const initialTex =
      texturesMapRef.current.get(activeChamberRef.current) ?? loadedTextures[0];
    const initialMood = TIME_LIGHTING_MOODS[timeRef.current];

    const domeUniforms = {
      uTexA: { value: initialTex as THREE.Texture | null },
      uTexB: { value: initialTex as THREE.Texture | null },
      uMix: { value: 0 },
      uPortalUv: { value: new THREE.Vector2(0.5, 0.34) },
      uTint: { value: new THREE.Color(...initialMood.tintRgb) },
      uBrightness: { value: initialMood.brightness },
      uNightFactor: { value: initialMood.nightFactor },
    };
    domeUniformsRef.current = domeUniforms;

    const thetaStart = Math.PI - ARC_THETA / 2;
    const domeGeo = new THREE.CylinderGeometry(
      ARC_RADIUS,
      ARC_RADIUS,
      ARC_HEIGHT,
      64,
      1,
      true,
      thetaStart,
      ARC_THETA
    );
    const domeMat = new THREE.ShaderMaterial({
      uniforms: domeUniforms,
      vertexShader: DOME_VERTEX_SHADER,
      fragmentShader: DOME_FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(domeGeo, domeMat));

    const beamTex = createSunbeamTexture();
    const beamGeo = new THREE.PlaneGeometry(3.2, 16);
    const beamDefs = [
      { x: -6.2, y: 3.4, z: -14.5, rotZ: -0.34, color: 0xffd79e },
      { x: -1.6, y: 3.8, z: -15.5, rotZ: -0.26, color: 0xffe4b3 },
      { x: 2.8, y: 3.6, z: -15.0, rotZ: -0.22, color: 0xffc68c },
      { x: 6.4, y: 3.2, z: -14.0, rotZ: -0.18, color: 0x35d6b7 },
    ];
    const beamMats: THREE.MeshBasicMaterial[] = [];
    beamDefs.forEach((b) => {
      const mat = new THREE.MeshBasicMaterial({
        map: beamTex,
        color: b.color,
        transparent: true,
        opacity: initialMood.beamOpacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(beamGeo, mat);
      mesh.position.set(b.x, b.y, b.z);
      mesh.rotation.z = b.rotZ;
      beamMats.push(mat);
      scene.add(mesh);
    });

    const particleTex = createSoftParticleTexture();
    const moteCount = 180;
    const motePositions = new Float32Array(moteCount * 3);
    const moteVels = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePositions[i * 3] = (Math.random() - 0.5) * 24;
      motePositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      motePositions[i * 3 + 2] = -2 - Math.random() * 20;
      moteVels[i * 3] = (Math.random() - 0.5) * 0.45;
      moteVels[i * 3 + 1] = (Math.random() - 0.5) * 0.25;
      moteVels[i * 3 + 2] = 1.6 + Math.random() * 2.4;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMat = new THREE.PointsMaterial({
      map: particleTex,
      color: 0xfff2d2,
      size: 0.24,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const motePoints = new THREE.Points(moteGeo, moteMat);
    motePoints.frustumCulled = false;
    scene.add(motePoints);

    // Touch gesture conflict guard: pan-y + crisp horizontal threshold (14px + >1.4x vertical delta)
    const el = renderer.domElement;
    el.style.touchAction = 'pan-y';

    const onPointerDown = (e: PointerEvent) => {
      dragStateRef.current = {
        down: true,
        lastX: e.clientX,
        lastY: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        pointerType: e.pointerType || 'mouse',
        mode: e.pointerType === 'touch' ? 'pending' : 'pan',
      };
      if (e.pointerType !== 'touch') setIsDragging(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const spec =
        HAWA_MAHAL_CHAMBERS.find((c) => c.id === activeChamberRef.current) ?? HAWA_MAHAL_CHAMBERS[0];
      if (dragStateRef.current.down) {
        if (dragStateRef.current.pointerType === 'touch') {
          if (dragStateRef.current.mode === 'scroll') return;
          if (dragStateRef.current.mode === 'pending') {
            const adx = Math.abs(e.clientX - dragStateRef.current.startX);
            const ady = Math.abs(e.clientY - dragStateRef.current.startY);
            if (adx < 14 && ady < 14) return;
            if (ady >= adx || adx < ady * 1.4) {
              dragStateRef.current.mode = 'scroll';
              return;
            }
            dragStateRef.current.mode = 'pan';
            setIsDragging(true);
          }
        }
        const dx = e.clientX - dragStateRef.current.lastX;
        const dy = e.clientY - dragStateRef.current.lastY;
        dragStateRef.current.lastX = e.clientX;
        dragStateRef.current.lastY = e.clientY;
        lookRef.current.targetYaw = THREE.MathUtils.clamp(
          lookRef.current.targetYaw + dx * 0.0024,
          -0.42,
          0.42
        );
        if (dragStateRef.current.pointerType !== 'touch') {
          lookRef.current.targetPitch = THREE.MathUtils.clamp(
            lookRef.current.targetPitch + dy * 0.0016,
            -0.18,
            0.18
          );
        }
      } else if (e.pointerType !== 'touch') {
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        lookRef.current.targetYaw = THREE.MathUtils.clamp(spec.initialYaw - nx * 0.1, -0.42, 0.42);
        lookRef.current.targetPitch = THREE.MathUtils.clamp(
          spec.initialPitch - ny * 0.04,
          -0.18,
          0.18
        );
      }
    };

    const onPointerUp = () => {
      dragStateRef.current.down = false;
      dragStateRef.current.mode = 'pending';
      setIsDragging(false);
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pause WebGL render loop when offscreen or tab hidden
    const io = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
        if (isVisibleRef.current && document.visibilityState === 'visible') {
          clock.getDelta();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        clock.getDelta();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    const clock = new THREE.Clock();
    const scratchTint = new THREE.Color();
    const scratchPortalWorld = new THREE.Vector3();
    const scratchProj = new THREE.Vector3();
    const stainedColors = [0x0f9b82, 0xe02854, 0xf29f24, 0x3b6ee8];
    const goldenColors = [0xffd79e, 0xffe4b3, 0xffc68c, 0xffdfa8];

    let disposed = false;
    let rafId = 0;

    const projectPortalElement = (
      btn: HTMLButtonElement | null,
      portal: { u: number; v: number } | undefined,
      viewW: number,
      viewH: number
    ) => {
      if (!btn) return;
      if (!portal || transitionRef.current.active) {
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        return;
      }
      uvToArcWorld(portal.u, portal.v, scratchPortalWorld);
      scratchProj.copy(scratchPortalWorld).project(camera);
      if (scratchProj.z > 1) {
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        return;
      }
      const sx = ((scratchProj.x + 1) * 0.5) * viewW;
      const sy = ((-scratchProj.y + 1) * 0.5) * viewH;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      btn.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
    };

    const tick = () => {
      if (disposed) return;
      rafId = window.requestAnimationFrame(tick);

      if (!isVisibleRef.current || document.visibilityState !== 'visible') {
        return;
      }

      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      const mood = TIME_LIGHTING_MOODS[timeRef.current];
      const chamberSpec =
        HAWA_MAHAL_CHAMBERS.find((c) => c.id === activeChamberRef.current) ?? HAWA_MAHAL_CHAMBERS[0];

      scratchTint.setRGB(...mood.tintRgb);
      domeUniforms.uTint.value.lerp(scratchTint, 1 - Math.exp(-4.5 * dt));
      domeUniforms.uBrightness.value = THREE.MathUtils.damp(
        domeUniforms.uBrightness.value,
        mood.brightness,
        4.5,
        dt
      );
      domeUniforms.uNightFactor.value = THREE.MathUtils.damp(
        domeUniforms.uNightFactor.value,
        mood.nightFactor,
        4.5,
        dt
      );

      const isStained = chamberSpec.beamStyle === 'stained-glass';
      const targetBeamOpacity = mood.beamOpacity * (isStained ? 1.15 : 0.75);
      beamMats.forEach((bm, idx) => {
        bm.opacity = THREE.MathUtils.damp(bm.opacity, targetBeamOpacity, 4, dt);
        bm.color.setHex(
          isStained ? stainedColors[idx % stainedColors.length] : goldenColors[idx % goldenColors.length]
        );
      });

      if (transitionRef.current.active) {
        transitionRef.current.progress = Math.min(1, transitionRef.current.progress + dt * 0.92);
        const p = transitionRef.current.progress;
        domeUniforms.uMix.value = p;
        camera.position.y = Math.sin(p * Math.PI * 4) * 0.14 * (1 - p);
        if (p >= 1) {
          transitionRef.current.active = false;
          domeUniforms.uTexA.value = domeUniforms.uTexB.value;
          domeUniforms.uMix.value = 0;
          camera.position.y = 0;
        }
      }

      const keys = keysRef.current;
      if (keys.KeyA || keys.ArrowLeft) lookRef.current.targetYaw += dt * 0.55;
      if (keys.KeyD || keys.ArrowRight) lookRef.current.targetYaw -= dt * 0.55;
      if (keys.KeyW || keys.ArrowUp) lookRef.current.targetStepZ -= dt * 4.5;
      if (keys.KeyS || keys.ArrowDown) lookRef.current.targetStepZ += dt * 4.5;

      lookRef.current.targetStepZ = THREE.MathUtils.clamp(lookRef.current.targetStepZ, -5.5, 1.5);
      const maxSafeFov = THREE.MathUtils.radToDeg(
        2 * Math.atan(Math.tan((ARC_THETA - 0.08) * 0.5) / Math.max(0.5, camera.aspect))
      );
      const clampedTargetFov = Math.min(Math.max(32, lookRef.current.targetFov), maxSafeFov);
      const vFovRad = THREE.MathUtils.degToRad(camera.fov);
      const hFovRad = 2 * Math.atan(Math.tan(vFovRad * 0.5) * camera.aspect);
      const maxSafeYaw = Math.max(0.05, ARC_THETA * 0.5 - hFovRad * 0.5 - 0.03);
      const maxSafePitch = Math.max(
        0.035,
        Math.atan((ARC_HEIGHT * 0.5) / ARC_RADIUS) - vFovRad * 0.5 - 0.015
      );

      lookRef.current.targetYaw = THREE.MathUtils.clamp(lookRef.current.targetYaw, -maxSafeYaw, maxSafeYaw);
      lookRef.current.targetPitch = THREE.MathUtils.clamp(
        lookRef.current.targetPitch,
        -maxSafePitch,
        maxSafePitch
      );
      lookRef.current.fov = THREE.MathUtils.damp(lookRef.current.fov, clampedTargetFov, 6, dt);
      lookRef.current.yaw = THREE.MathUtils.damp(lookRef.current.yaw, lookRef.current.targetYaw, 6, dt);
      lookRef.current.pitch = THREE.MathUtils.damp(
        lookRef.current.pitch,
        lookRef.current.targetPitch,
        6,
        dt
      );
      lookRef.current.stepZ = THREE.MathUtils.damp(
        lookRef.current.stepZ,
        lookRef.current.targetStepZ,
        6,
        dt
      );

      camera.rotation.order = 'YXZ';
      camera.rotation.y = lookRef.current.yaw;
      camera.rotation.x = lookRef.current.pitch;
      camera.position.z = lookRef.current.stepZ;
      if (Math.abs(camera.fov - lookRef.current.fov) > 0.05) {
        camera.fov = lookRef.current.fov;
        camera.updateProjectionMatrix();
      }
      camera.updateMatrixWorld();

      const breezeScale = breezeRef.current / 16;
      const mAttr = moteGeo.getAttribute('position') as THREE.BufferAttribute;
      const mArr = mAttr.array as Float32Array;
      for (let i = 0; i < mArr.length; i += 3) {
        mArr[i] += moteVels[i] * breezeScale * dt + Math.sin(elapsed + i) * 0.003;
        mArr[i + 1] += moteVels[i + 1] * breezeScale * dt;
        mArr[i + 2] += moteVels[i + 2] * breezeScale * dt;
        if (mArr[i + 2] > 1) {
          mArr[i + 2] = -22;
          mArr[i] = (Math.random() - 0.5) * 24;
          mArr[i + 1] = (Math.random() - 0.5) * 14;
        }
      }
      mAttr.needsUpdate = true;

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      projectPortalElement(portalMarkerARef.current, chamberSpec.forwardPortal, cw, ch);
      projectPortalElement(portalMarkerBRef.current, chamberSpec.secondaryPortal, cw, ch);

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', handleResize);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      domeGeo.dispose();
      domeMat.dispose();
      beamGeo.dispose();
      beamTex.dispose();
      beamMats.forEach((m) => m.dispose());
      moteGeo.dispose();
      moteMat.dispose();
      particleTex.dispose();
      loadedTextures.forEach((tx) => tx.dispose());
      texturesMapRef.current.clear();
      renderer.dispose();
      if (el.parentNode === container) container.removeChild(el);
    };
  }, [onUnavailable]);

  const currentChamber =
    HAWA_MAHAL_CHAMBERS.find((c) => c.id === activeChamberId) ?? HAWA_MAHAL_CHAMBERS[0];

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className={`w-full h-full touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />

      <button
        ref={portalMarkerARef}
        type="button"
        onClick={() =>
          currentChamber.forwardPortal &&
          enterChamber(currentChamber.forwardPortal.targetChamber, currentChamber.forwardPortal)
        }
        className="absolute top-0 left-0 z-10 min-h-[44px] px-3.5 py-2 rounded-md bg-[#180C09]/85 text-[#FBF3E4] border border-[#F4B400]/75 hover:bg-[#B3123F] hover:border-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer whitespace-nowrap"
        style={{ opacity: 0, pointerEvents: 'none' }}
      >
        <Footprints className="w-3.5 h-3.5 text-[#F4B400]" />
        <span>{currentChamber.forwardPortal?.label ?? 'Step Inside'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <button
        ref={portalMarkerBRef}
        type="button"
        onClick={() =>
          currentChamber.secondaryPortal &&
          enterChamber(currentChamber.secondaryPortal.targetChamber, currentChamber.secondaryPortal)
        }
        className="absolute top-0 left-0 z-10 min-h-[44px] px-3 py-1.5 rounded-md bg-[#180C09]/80 text-[#FBF3E4] border border-[#C9A227]/60 hover:bg-[#0F7B6C] text-xs font-semibold inline-flex items-center gap-1 shadow-md transition-colors cursor-pointer whitespace-nowrap"
        style={{ opacity: 0, pointerEvents: 'none' }}
      >
        <span>{currentChamber.secondaryPortal?.label ?? 'Explore Gallery'}</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
