"use client";
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

function Model() {
  const { scene } = useGLTF('/3dfile/a_windy_day/scene.gltf')
  const modelRef = useRef()

  useFrame((state) => {
    if (modelRef.current) {
        // @ts-ignore
      modelRef.current.rotation.y += 0.002
    }
  })

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={[4, 4, 4]} 
      position={[0, -1, 0]}
    />
  )
}

export function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <Suspense fallback={null}>
        <Model />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.05} />
    </>
  )
}

useGLTF.preload('/3dfile/a_windy_day/scene.gltf')