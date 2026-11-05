'use client';

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';

function ProductModel({ url, onLoaded }: { url: string; onLoaded?: () => void }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    // Report asynchronously so the parent state update is not synchronised
    // inside the effect body.
    const timer = window.setTimeout(() => onLoaded?.(), 0);
    return () => window.clearTimeout(timer);
  }, [onLoaded]);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

export default function Product3DViewer({
  modelUrl,
  onLoaded,
}: {
  modelUrl: string;
  onLoaded?: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [2.4, 1.6, 3], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.85} />
      <hemisphereLight intensity={0.45} groundColor="#3a2f22" />
      <directionalLight position={[4, 6, 3]} intensity={1.8} />
      <directionalLight position={[-5, 2.5, -4]} intensity={0.5} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.15}>
          <ProductModel url={modelUrl} onLoaded={onLoaded} />
        </Bounds>
        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.38}
          scale={7}
          blur={2.6}
          far={2.6}
          resolution={512}
          color="#241a10"
        />
      </Suspense>
      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={1.1}
        enablePan={false}
        minDistance={1.4}
        maxDistance={9}
      />
    </Canvas>
  );
}
