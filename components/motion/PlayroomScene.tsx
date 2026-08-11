"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Lightweight Three.js atmosphere: floating paper sheets + crayon-dots.
 * Metaphor for printables — decorative only, pointer-events none, pauses offscreen.
 */
export default function PlayroomScene({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || prefersReducedMotion()) return;

    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });

    const group = new THREE.Group();
    scene.add(group);

    const colors = [0xff7a45, 0x0f9f6e, 0x3fa9e0, 0xffb020, 0xc49bff];
    const sheets: THREE.Mesh[] = [];

    // Floating worksheet planes (soft pastel papers)
    for (let i = 0; i < 7; i++) {
      const geo = new THREE.PlaneGeometry(1.1 + Math.random() * 0.5, 1.4 + Math.random() * 0.4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfffdf8,
        transparent: true,
        opacity: 0.55 + Math.random() * 0.2,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4 - 1
      );
      mesh.rotation.z = (Math.random() - 0.5) * 0.5;
      mesh.rotation.x = -0.25 + Math.random() * 0.2;
      mesh.userData = {
        speed: 0.15 + Math.random() * 0.25,
        rot: (Math.random() - 0.5) * 0.2,
        phase: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
      };
      // colored corner badge
      const badge = new THREE.Mesh(
        new THREE.CircleGeometry(0.12, 16),
        new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 0.85,
        })
      );
      badge.position.set(0.35, 0.5, 0.02);
      mesh.add(badge);
      group.add(mesh);
      sheets.push(mesh);
    }

    // Soft confetti spheres = crayons tips / confetti
    const dots: THREE.Mesh[] = [];
    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 10, 10),
        new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 0.55,
        })
      );
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
      );
      mesh.userData = {
        speed: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
      };
      group.add(mesh);
      dots.push(mesh);
    }

    let frame = 0;
    let raf = 0;
    let visible = true;

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(mount);

    const onResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      if (!nw || !nh) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      frame += 0.008;
      sheets.forEach((m, i) => {
        const u = m.userData;
        m.position.y = u.baseY + Math.sin(frame * u.speed + u.phase) * 0.35;
        m.rotation.z += u.rot * 0.004;
        m.position.x += Math.sin(frame * 0.1 + i) * 0.002;
      });
      dots.forEach((m) => {
        const u = m.userData;
        m.position.y = u.baseY + Math.sin(frame * u.speed + u.phase) * 0.5;
      });
      group.rotation.y = Math.sin(frame * 0.15) * 0.08;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
      sheets.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      dots.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none absolute inset-0 -z-0 overflow-hidden opacity-70 ${className}`}
      aria-hidden
    />
  );
}
