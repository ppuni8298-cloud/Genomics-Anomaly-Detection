'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface DnaHelixSceneProps {
  reducedMotion?: boolean;
}

export function DnaHelixScene({ reducedMotion = false }: DnaHelixSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const { viewport } = useThree();

  // Track mouse coordinates for desktop parallax
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = normalizedX * 0.4;
      mouseRef.current.targetY = normalizedY * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate DNA Double Helix geometry data
  const { strandA, strandB, rungs } = useMemo(() => {
    const count = 28;
    const radius = 1.35;
    const heightSpread = 0.24;
    const twistFactor = 0.38;

    const sA: { position: [number, number, number]; id: number }[] = [];
    const sB: { position: [number, number, number]; id: number }[] = [];
    const connectingRungs: {
      position: [number, number, number];
      rotation: [number, number, number];
      length: number;
      id: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const angle = i * twistFactor;
      const y = (i - count / 2) * heightSpread;

      const xA = Math.cos(angle) * radius;
      const zA = Math.sin(angle) * radius;

      const xB = Math.cos(angle + Math.PI) * radius;
      const zB = Math.sin(angle + Math.PI) * radius;

      sA.push({ position: [xA, y, zA], id: i });
      sB.push({ position: [xB, y, zB], id: i });

      // Midpoint between the two strands for the nucleotide rung
      const midX = (xA + xB) / 2;
      const midY = y;
      const midZ = (zA + zB) / 2;

      // Direction vector
      const dx = xB - xA;
      const dz = zB - zA;
      const length = Math.sqrt(dx * dx + dz * dz);
      const rotY = -Math.atan2(dz, dx);

      connectingRungs.push({
        position: [midX, midY, midZ],
        rotation: [0, rotY, Math.PI / 2],
        length,
        id: i,
      });
    }

    return { strandA: sA, strandB: sB, rungs: connectingRungs };
  }, []);

  // Ambient floating background particles
  const particlePositions = useMemo(() => {
    const pCount = 70;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (!reducedMotion) {
      // Smooth mouse follow
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Gentle continuous rotation & floating
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.rotation.x = 0.15 + mouseRef.current.y * 0.3;
      groupRef.current.rotation.z = mouseRef.current.x * 0.2;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.12;

      if (particlesRef.current) {
        particlesRef.current.rotation.y += delta * 0.08;
      }
    }
  });

  // Responsive scale based on viewport width
  const scale = viewport.width < 5 ? 0.75 : 1.0;

  return (
    <>
      {/* Lighting tailored to cyan & neon violet palette */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 6, 4]} intensity={0.8} color="#F8FAFC" />
      <pointLight position={[-3, 2, 3]} intensity={3.5} distance={8} color="#28D7FF" />
      <pointLight position={[3, -2, -3]} intensity={4.0} distance={8} color="#8B5CF6" />
      <pointLight position={[0, 4, 0]} intensity={2.0} distance={6} color="#C084FC" />

      {/* Main DNA Double Helix */}
      <group ref={groupRef} scale={[scale, scale, scale]}>
        {/* Strand A: Electric Blue Spheres */}
        {strandA.map((node) => (
          <mesh key={`a-${node.id}`} position={node.position}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial
              color="#28D7FF"
              emissive="#28D7FF"
              emissiveIntensity={0.6}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        ))}

        {/* Strand B: Neon Violet Spheres */}
        {strandB.map((node) => (
          <mesh key={`b-${node.id}`} position={node.position}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial
              color="#8B5CF6"
              emissive="#8B5CF6"
              emissiveIntensity={0.65}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        ))}

        {/* Connecting Nucleotide Rungs (Base Pairs) */}
        {rungs.map((rung) => (
          <mesh
            key={`rung-${rung.id}`}
            position={rung.position}
            rotation={rung.rotation}
          >
            <cylinderGeometry args={[0.026, 0.026, rung.length, 10]} />
            <meshStandardMaterial
              color="#C084FC"
              emissive="#C084FC"
              emissiveIntensity={0.35}
              transparent
              opacity={0.75}
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Ambient glowing bio-particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#28D7FF"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
