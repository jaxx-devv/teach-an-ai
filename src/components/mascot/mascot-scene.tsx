"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MascotExpression } from "@/lib/constants";

const PALETTE = {
  body: "#F5F5F4",
  face: "#0B0B14",
  eye: "#5EEAD4",
  teal: "#14B8A6",
  amber: "#FBBF24",
  lavender: "#A78BFA",
  sky: "#38BDF8",
};

const EXPRESSION_TARGETS: Record<MascotExpression, { squint: number; glow: number }> = {
  idle: { squint: 1, glow: 1 },
  curious: { squint: 1, glow: 1 },
  thinking: { squint: 0.55, glow: 0.85 },
  confused: { squint: 0.7, glow: 0.9 },
  excited: { squint: 1, glow: 1.5 },
  proud: { squint: 0.6, glow: 1.3 },
  focused: { squint: 0.45, glow: 1 },
  sleepy: { squint: 0.25, glow: 0.6 },
  sad: { squint: 0.7, glow: 0.7 },
  surprised: { squint: 1.3, glow: 1.4 },
};

function useHeadGeometry() {
  return useMemo(() => {
    const geo = new THREE.BoxGeometry(1.5, 1.7, 1.1, 24, 28, 24);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    const taper = (ny: number) => {
      if (ny > 0.15) {
        const t = (ny - 0.15) / 0.85;
        return THREE.MathUtils.lerp(1.0, 0.06, Math.pow(t, 1.35));
      }
      const t = (ny + 1) / 1.15;
      return THREE.MathUtils.lerp(0.55, 1.0, Math.pow(Math.min(t, 1), 0.7));
    };

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const ny = v.y / 0.85;
      const scale = taper(ny);
      v.x *= scale;
      v.z *= scale;

      const nx = v.x / (0.75 * scale || 1);
      const nz = v.z / (0.55 * scale || 1);
      const r = Math.sqrt(nx * nx + nz * nz);
      if (r > 0.001) {
        const round = 1 - 0.22 * Math.max(0, r - 0.55);
        v.x *= round;
        v.z *= round;
      }

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);
}

function EarPiece({
  position,
  rotation,
  color,
  scale = 1,
  phase = 0,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale?: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = position[1] + Math.sin(t * 1.4 + phase) * 0.035;
    ref.current.rotation.z = rotation[2] + Math.sin(t * 2 + phase) * 0.05;
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation} scale={scale}>
      <coneGeometry args={[0.15, 0.42, 3, 1]} />
      <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.06} clearcoat={0.5} clearcoatRoughness={0.35} />
    </mesh>
  );
}

function Face({
  blink,
  squintRef,
  glowRef,
}: {
  blink: React.MutableRefObject<number>;
  squintRef: React.MutableRefObject<number>;
  glowRef: React.MutableRefObject<number>;
}) {
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const leftMat = useRef<THREE.MeshStandardMaterial>(null);
  const rightMat = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const { pointer } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = blink.current * squintRef.current;

    const wanderX = Math.sin(t * 0.3) * 0.03;
    const wanderY = Math.cos(t * 0.25) * 0.02;
    const cursorX = pointer.x * 0.05;
    const cursorY = pointer.y * 0.03;

    if (left.current) {
      left.current.scale.y = s;
      left.current.position.x = -0.15 + wanderX + cursorX;
      left.current.position.y = wanderY + cursorY;
    }
    if (right.current) {
      right.current.scale.y = s;
      right.current.position.x = 0.15 + wanderX + cursorX;
      right.current.position.y = wanderY + cursorY;
    }

    const pulse = glowRef.current * (1.6 + Math.sin(t * 3) * 0.2);
    if (leftMat.current) leftMat.current.emissiveIntensity = pulse;
    if (rightMat.current) rightMat.current.emissiveIntensity = pulse;
    if (light.current) light.current.intensity = 0.5 * glowRef.current + Math.sin(t * 3) * 0.1;
  });

  return (
    <group position={[0, 0.0, 0]}>
      {/* fake ambient-occlusion seam where the face meets the shell */}
      <mesh position={[0, 0, 0.558]}>
        <circleGeometry args={[0.465, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      <mesh position={[0, 0, 0.565]}>
        <circleGeometry args={[0.42, 40]} />
        <meshPhysicalMaterial color={PALETTE.face} roughness={0.18} metalness={0.05} clearcoat={0.3} clearcoatRoughness={0.4} />
      </mesh>

      <group position={[0, 0.02, 0.585]}>
        <mesh ref={left}>
          <capsuleGeometry args={[0.06, 0.16, 4, 12]} />
          <meshStandardMaterial ref={leftMat} color={PALETTE.eye} emissive={PALETTE.eye} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh ref={right}>
          <capsuleGeometry args={[0.06, 0.16, 4, 12]} />
          <meshStandardMaterial ref={rightMat} color={PALETTE.eye} emissive={PALETTE.eye} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <pointLight ref={light} color={PALETTE.eye} intensity={0.5} distance={1.3} position={[0, 0, 0.15]} />
      </group>
    </group>
  );
}

function AmbientParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        radius: 1.3 + Math.random() * 0.5,
        speed: 0.15 + Math.random() * 0.15,
        phase: (i / 7) * Math.PI * 2,
        height: (Math.random() - 0.5) * 1.4,
        size: 0.02 + Math.random() * 0.025,
        color: [PALETTE.lavender, PALETTE.teal, PALETTE.amber, PALETTE.sky][i % 4],
      })),
    []
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const angle = t * p.speed + p.phase;
      mesh.position.x = Math.cos(angle) * p.radius;
      mesh.position.z = Math.sin(angle) * p.radius;
      mesh.position.y = p.height + Math.sin(t * 0.6 + p.phase) * 0.15;
    });
  });

  return (
    <>
      {particles.map((p, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={p.color} toneMapped={false} transparent opacity={0.75} />
        </mesh>
      ))}
    </>
  );
}

function MascotBody({ expression }: { expression: MascotExpression }) {
  const outer = useRef<THREE.Group>(null);
  const headCore = useRef<THREE.Group>(null);
  const earsGroup = useRef<THREE.Group>(null);
  const antennaGroup = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Mesh>(null);
  const blink = useRef(1);
  const squint = useRef(1);
  const glow = useRef(1);
  const antennaVel = useRef(0);
  const antennaAngle = useRef(0);
  const nextBlinkAt = useRef(2 + Math.random() * 3);
  const { pointer } = useThree();
  const headGeo = useHeadGeometry();

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    if (outer.current) {
      outer.current.position.y = Math.sin(t * 1.2) * 0.06;
      const breathe = 1 + Math.sin(t * 1.3) * 0.015;
      outer.current.scale.setScalar(breathe);
    }

    const target = EXPRESSION_TARGETS[expression];
    squint.current = THREE.MathUtils.lerp(squint.current, target.squint, 0.06);
    glow.current = THREE.MathUtils.lerp(glow.current, target.glow, 0.06);

    if (t > nextBlinkAt.current) {
      nextBlinkAt.current = t + 2 + Math.random() * 4;
    }
    const blinkWindow = nextBlinkAt.current - t;
    blink.current = blinkWindow < 0.12 && blinkWindow > 0 ? 0.08 : 1;

    const targetX = pointer.y * 0.14;
    const targetY = pointer.x * 0.24;

    if (headCore.current) {
      headCore.current.rotation.x = THREE.MathUtils.lerp(headCore.current.rotation.x, targetX, 0.2);
      headCore.current.rotation.y = THREE.MathUtils.lerp(headCore.current.rotation.y, targetY, 0.2);
    }
    if (earsGroup.current) {
      earsGroup.current.rotation.x = THREE.MathUtils.lerp(earsGroup.current.rotation.x, targetX, 0.1);
      earsGroup.current.rotation.y = THREE.MathUtils.lerp(earsGroup.current.rotation.y, targetY, 0.1);
    }
    if (antennaGroup.current) {
      const stiffness = 90;
      const damping = 9;
      const accel = (targetY - antennaAngle.current) * stiffness - antennaVel.current * damping;
      antennaVel.current += accel * delta;
      antennaAngle.current += antennaVel.current * delta;
      antennaGroup.current.rotation.z = -antennaAngle.current * 0.6;
      antennaGroup.current.rotation.x = THREE.MathUtils.lerp(antennaGroup.current.rotation.x, targetX * 0.6, 0.05);
    }

    if (orb.current) {
      orb.current.position.y = 1.02 + Math.sin(t * 1.8) * 0.04;
      orb.current.rotation.y = t * 0.6;
    }
  });

  return (
    <group ref={outer}>
      <group ref={headCore}>
        <mesh geometry={headGeo}>
          <meshPhysicalMaterial color={PALETTE.body} roughness={0.28} metalness={0.06} clearcoat={0.8} clearcoatRoughness={0.3} />
        </mesh>
        <Face blink={blink} squintRef={squint} glowRef={glow} />
      </group>

      <group ref={antennaGroup} position={[0, 0.86, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.024, 0.24, 8]} />
          <meshStandardMaterial color={PALETTE.body} roughness={0.5} metalness={0.05} />
        </mesh>
        <mesh ref={orb} position={[0, 0.16, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={PALETTE.lavender} emissive={PALETTE.lavender} emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
      </group>

      <group ref={earsGroup}>
        <EarPiece position={[-0.72, 0.0, 0.02]} rotation={[0, 0, Math.PI / 2.3]} color={PALETTE.teal} phase={0} />
        <EarPiece position={[0.72, 0.0, 0.02]} rotation={[0, 0, -Math.PI / 2.3]} color={PALETTE.amber} phase={1} />
        <EarPiece position={[-0.42, -0.68, 0.14]} rotation={[0, 0, Math.PI / 1.5]} color={PALETTE.lavender} scale={1.0} phase={2} />
        <EarPiece position={[0.42, -0.68, 0.14]} rotation={[0, 0, -Math.PI / 1.5]} color={PALETTE.sky} scale={1.0} phase={3} />
      </group>

      <AmbientParticles />
    </group>
  );
}

export function MascotScene({
  expression = "curious",
  className,
}: {
  expression?: MascotExpression;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0.05, 4.4], fov: 34 }} dpr={1} gl={{ antialias: true, powerPreference: "low-power" }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[1.4, 2.2, 2.6]} intensity={0.85} />
        <directionalLight position={[-2.2, 0.4, -1.2]} intensity={0.35} color="#A78BFA" />
        <directionalLight position={[1.5, -0.6, -1.8]} intensity={0.22} color="#14B8A6" />
        <Suspense fallback={null}>
          <MascotBody expression={expression} />
          <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.6, 24]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.16} />
          </mesh>
          <mesh position={[0, -0.94, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.85, 24]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.09} />
          </mesh>
          <mesh position={[0, -0.93, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.1, 24]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.04} />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default MascotScene;
