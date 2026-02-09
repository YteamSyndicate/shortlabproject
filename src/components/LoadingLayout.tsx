"use client";

import { useLoading, type LoadingContextType } from "@/components/LoadingContext";
import Loading from "@/app/loading"; 
import React from "react";

export function LoadingLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useLoading() as LoadingContextType;

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-9999 bg-black overflow-hidden">
          <Loading />
        </div>
      )}
      {children}
    </>
  );
}