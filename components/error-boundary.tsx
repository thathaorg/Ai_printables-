"use client";

import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

type State = { hasError: boolean };

/** Catch render crashes so mobile doesn't show a blank "couldn't load" tab. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    console.error("UI error boundary:", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto max-w-md px-6 py-24 text-center">
            <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Please refresh the page — your worksheets are still safe.
            </p>
            <button
              type="button"
              className="mt-6 rounded-full bg-[var(--kiwi)] px-5 py-2.5 font-display text-sm font-bold text-white"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
