import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

function NeuralSphere() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // ── Neural Sphere Group ──
    const sphereGroup = new THREE.Group();

    // Wireframe sphere core
    const coreGeometry = new THREE.IcosahedronGeometry(1.5, 2);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x6c63ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);
    sphereGroup.add(coreSphere);

    // Glowing nodes at vertices
    const nodePositions = coreGeometry.attributes.position;
    const nodesGroup = new THREE.Group();
    const nodeColors = [0x6c63ff, 0xff6584, 0x43e97b, 0xf093fb];

    for (let i = 0; i < nodePositions.count; i += 3) {
      const x = nodePositions.getX(i);
      const y = nodePositions.getY(i);
      const z = nodePositions.getZ(i);

      const nodeGeometry = new THREE.SphereGeometry(0.035, 8, 8);
      const color = nodeColors[Math.floor(Math.random() * nodeColors.length)];
      const nodeMaterial = new THREE.MeshBasicMaterial({ color });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, y, z);
      nodesGroup.add(node);
    }
    sphereGroup.add(nodesGroup);

    // Outer glow ring
    const ringGeometry = new THREE.TorusGeometry(2.2, 0.008, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6584,
      transparent: true,
      opacity: 0.5
    });
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.rotation.x = Math.PI / 3;
    sphereGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry.clone(), new THREE.MeshBasicMaterial({
      color: 0x43e97b,
      transparent: true,
      opacity: 0.35
    }));
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 3;
    sphereGroup.add(ring2);

    // Floating particles around sphere
    const particleCount = 150;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 3 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x8b83ff,
      size: 0.02,
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    scene.add(sphereGroup);

    // Lighting (subtle, mostly for depth)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      sphereGroup.rotation.y = elapsed * 0.15;
      sphereGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.15;

      // Gentle mouse-follow tilt
      sphereGroup.rotation.y += mouseX * 0.0003;
      sphereGroup.rotation.x += mouseY * 0.0003;

      ring1.rotation.z = elapsed * 0.3;
      ring2.rotation.z = -elapsed * 0.25;

      particles.rotation.y = elapsed * 0.02;

      // Pulse nodes
      nodesGroup.children.forEach((node, i) => {
        const scale = 1 + Math.sin(elapsed * 2 + i) * 0.3;
        node.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      coreGeometry.dispose();
      coreMaterial.dispose();
      ringGeometry.dispose();
      particleGeometry.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

export default NeuralSphere;