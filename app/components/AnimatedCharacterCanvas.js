import { Canvas } from '@react-three/fiber';
import AnimatedCharacter from './AnimatedCharacter';

export default function AnimatedCharacterCanvas() {
  return (
    <Canvas className="absolute inset-0" camera={{ position: [0, 0, 5], fov: 50 }}>
      <AnimatedCharacter />
    </Canvas>
  );
}