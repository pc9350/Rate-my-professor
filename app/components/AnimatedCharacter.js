"use client";

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, PresentationControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';

export default function AnimatedCharacter() {
  const group = useRef();
  const { scene } = useGLTF('/avatar.glb');
  const rightArm = useRef();

  useEffect(() => {
    // Find the right arm bone in the model
    scene.traverse((object) => {
      if (object.name.toLowerCase().includes('arm') && object.name.toLowerCase().includes('right')) {
        rightArm.current = object;
      }
    });

    // If we found the right arm, animate it
    if (rightArm.current) {
      gsap.to(rightArm.current.rotation, {
        y: 0.5,
        z: -0.5,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    }
  }, [scene]);

  return (
    <>
      <PresentationControls
        global
        rotation={[0, -Math.PI / 4, 0]}
        polar={[-Math.PI / 4, Math.PI / 4]}
        azimuth={[-Math.PI / 4, Math.PI / 4]}
        config={{ mass: 2, tension: 400 }}
        snap={{ mass: 4, tension: 400 }}
      >
        <group ref={group} dispose={null} position={[0, -1, 0]} scale={[0.01, 0.01, 0.01]}>
          <primitive object={scene} />
        </group>
      </PresentationControls>

      <Environment preset="city" />
      <ContactShadows position={[0, -1.4, 0]} opacity={0.75} scale={10} blur={2.5} far={4} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
      </EffectComposer>
    </>
  );
}