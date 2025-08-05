'use client'

import { Canvas } from '@react-three/fiber'
import { Float, Environment, ContactShadows, MeshDistortMaterial, Sphere, Box, Octahedron, Stars, OrbitControls } from '@react-three/drei'
import { Suspense, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

function AnimatedSphere({ position, scale = 1, color = '#6B46C1' }: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.1}
          metalness={0.9}
          distort={0.4}
          speed={2}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  )
}

function AnimatedOctahedron({ position, scale = 1, color = '#F59E0B' }: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3
      meshRef.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * 0.5) * 0.2
    }
  })

  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <Octahedron args={[1, 0]}>
          <MeshDistortMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            roughness={0.2}
            metalness={0.7}
            distort={0.3}
            speed={1.5}
            transparent
            opacity={0.7}
          />
        </Octahedron>
      </mesh>
    </Float>
  )
}

function AnimatedBox({ position, scale = 1, color = '#10B981' }: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 0.6) * 0.15
    }
  })

  return (
    <Float speed={1.6} rotationIntensity={0.7} floatIntensity={0.9}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <Box args={[1.5, 1.5, 1.5]}>
          <MeshDistortMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            roughness={0.15}
            metalness={0.8}
            distort={0.25}
            speed={1.8}
            transparent
            opacity={0.75}
          />
        </Box>
      </mesh>
    </Float>
  )
}

function ParticleField() {
  const particles = useRef<THREE.Points>(null)
  const particleCount = 2000
  
  const { positions, colors, scales } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const scales = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80
      
      const color = new THREE.Color()
      const hue = Math.random() * 0.3 + 0.6 // 보라-파랑-청록 범위
      color.setHSL(hue, 0.7, 0.6)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      
      scales[i] = Math.random() * 0.5 + 0.5
    }
    
    return { positions, colors, scales }
  }, [])

  useFrame((state) => {
    if (particles.current) {
      particles.current.rotation.y = state.clock.elapsedTime * 0.08
      particles.current.rotation.x = state.clock.elapsedTime * 0.05
      
      // 동적 색상 변화
      const time = state.clock.elapsedTime
      for (let i = 0; i < particleCount; i++) {
        const hue = (Math.sin(time * 0.5 + i * 0.01) + 1) * 0.15 + 0.6
        const color = new THREE.Color()
        color.setHSL(hue, 0.7, 0.6)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }
      
      if (particles.current.geometry.attributes.color) {
        particles.current.geometry.attributes.color.needsUpdate = true
      }
    }
  })

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        vertexColors 
        sizeAttenuation={true}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function FloatingRings() {
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const ring3 = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (ring1.current) {
      ring1.current.rotation.x = time * 0.3
      ring1.current.rotation.y = time * 0.2
      ring1.current.position.y = Math.sin(time * 0.7) * 0.5
    }
    
    if (ring2.current) {
      ring2.current.rotation.x = -time * 0.4
      ring2.current.rotation.z = time * 0.25
      ring2.current.position.x = Math.cos(time * 0.5) * 0.3
    }
    
    if (ring3.current) {
      ring3.current.rotation.y = time * 0.5
      ring3.current.rotation.z = -time * 0.3
      ring3.current.position.z = Math.sin(time * 0.4) * 0.4
    }
  })

  return (
    <group>
      <mesh ref={ring1} position={[-4, 1, -6]} scale={2}>
        <torusGeometry args={[1, 0.1, 16, 100]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.2}
          transparent
          opacity={0.6}
          wireframe
        />
      </mesh>
      
      <mesh ref={ring2} position={[4, -2, -4]} scale={1.5}>
        <torusGeometry args={[1.2, 0.08, 16, 100]} />
        <meshStandardMaterial
          color="#06B6D4"
          emissive="#06B6D4"
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
          wireframe
        />
      </mesh>
      
      <mesh ref={ring3} position={[0, 3, -8]} scale={1.8}>
        <torusGeometry args={[0.8, 0.12, 16, 100]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#F59E0B"
          emissiveIntensity={0.25}
          transparent
          opacity={0.5}
          wireframe
        />
      </mesh>
    </group>
  )
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 75 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: false
        }}
      >
        <Suspense fallback={null}>
          {/* 별하늘 배경 */}
          <Stars 
            radius={100} 
            depth={50} 
            count={8000} 
            factor={6} 
            saturation={0.8} 
            fade 
            speed={0.5}
          />
          
          {/* 조명 설정 */}
          <ambientLight intensity={0.2} />
          <directionalLight position={[15, 15, 8]} intensity={0.8} color="#ffffff" />
          <pointLight position={[-15, -15, -8]} intensity={0.6} color="#8B5CF6" />
          <pointLight position={[8, -8, 5]} intensity={0.4} color="#06B6D4" />
          <spotLight 
            position={[0, 10, 0]} 
            angle={0.3} 
            penumbra={1} 
            intensity={0.5} 
            color="#F59E0B"
          />
          
          {/* 메인 3D 객체들 */}
          <AnimatedSphere position={[-4, 3, -6]} scale={1.8} color="#8B5CF6" />
          <AnimatedOctahedron position={[4, -2, -4]} scale={1.2} color="#06B6D4" />
          <AnimatedBox position={[-2, -3, -8]} scale={1} color="#10B981" />
          <AnimatedSphere position={[3, 1, -10]} scale={1.4} color="#F59E0B" />
          <AnimatedOctahedron position={[-5, -1, -3]} scale={0.8} color="#EC4899" />
          
          {/* 파티클 필드 */}
          <ParticleField />
          
          {/* 플로팅 링들 */}
          <FloatingRings />
          
          {/* 환경과 그림자 */}
          <Environment preset="night" />
          <ContactShadows 
            position={[0, -6, 0]} 
            opacity={0.3} 
            scale={25} 
            blur={3} 
            far={10}
            color="#000000"
          />
          
          {/* 카메라 컨트롤 (자동 회전) */}
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            enableRotate={false}
            autoRotate 
            autoRotateSpeed={0.3}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}