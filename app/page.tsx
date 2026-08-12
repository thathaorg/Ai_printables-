"use client";

import { useState, useEffect } from "react";
import SplashScreen from "@/components/splash-screen";
import HomePage from "@/components/home-page";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const hasVisited = localStorage.getItem("kiwiz-has-visited");
      if (hasVisited) setShowSplash(false);
    } catch {
      setShowSplash(false);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-[#eef8f4]" />;
  }

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          try {
            localStorage.setItem("kiwiz-has-visited", "true");
          } catch {
            /* private mode */
          }
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}
