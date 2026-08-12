"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Lightweight Three.js atmosphere (desktop only — parent gates mobile).
 * Fully try/catch so a WebGL failure never takes down the page.
 */
export default function PlayroomScene({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || prefersReducedMotion()) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;
    let io: IntersectionObserver | null = null;

    try {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
      camera.position.z = 10;

      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
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

      for (let i = 0; i < 4; i++) {
        const geo = new THREE.PlaneGeometry(1.1 + Math.random() * 0.4, 1.35);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xfffdf8,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 7, -1);
        mesh.rotation.z = (Math.random() - 0.5) * 0.4;
        mesh.userData = {
          speed: 0.15 + Math.random() * 0.2,
          rot: (Math.random() - 0.5) * 0.15,
          phase: Math.random() * Math.PI * 2,
          baseY: mesh.position.y,
        };
        const badge = new THREE.Mesh(
          new THREE.CircleGeometry(0.1, 12),
          new THREE.MeshBasicMaterial({
            color: colors[i % colors.length],
            transparent: true,
            opacity: 0.8,
          })
        );
        badge.position.set(0.3, 0.45, 0.02);
        mesh.add(badge);
        group.add(mesh);
        sheets.push(mesh);
      }

      const dots: THREE.Mesh[] = [];
      for (let i = 0; i < 10; i++) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 8, 8),
          new THREE.MeshBasicMaterial({
            color: colors[i % colors.length],
            transparent: true,
            opacity: 0.5,
          })
        );
        mesh.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 9, -1);
        mesh.userData = {
          speed: 0.2 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          baseY: mesh.position.y,
        };
        group.add(mesh);
        dots.push(mesh);
      }

      let frame = 0;
      let visible = true;

      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0.05 }
      );
      io.observe(mount);

      const onResize = () => {
        const nw = mount.clientWidth;
        const nh = mount.clientHeight;
        if (!nw || !nh || !renderer) return;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);

      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible || !renderer) return;
        frame += 0.008;
        sheets.forEach((m, i) => {
          const u = m.userData;
          m.position.y = u.baseY + Math.sin(frame * u.speed + u.phase) * 0.3;
          m.rotation.z += u.rot * 0.003;
          m.position.x += Math.sin(frame * 0.1 + i) * 0.0015;
        });
        dots.forEach((m) => {
          const u = m.userData;
          m.position.y = u.baseY + Math.sin(frame * u.speed + u.phase) * 0.4;
        });
        group.rotation.y = Math.sin(frame * 0.15) * 0.06;
        renderer.render(scene, camera);
      };
      tick();

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        io?.disconnect();
        sheets.forEach((m) => {
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        });
        dots.forEach((m) => {
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        });
        renderer?.dispose();
        if (renderer?.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    } catch (err) {
      console.warn("PlayroomScene skipped:", err);
      if (renderer?.domElement.parentNode === mount) {
        try {
          mount.removeChild(renderer.domElement);
        } catch {}
      }
      return;
    }
  }, []);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none absolute inset-0 -z-0 overflow-hidden opacity-70 ${className}`}
      aria-hidden
    />
  );
}
