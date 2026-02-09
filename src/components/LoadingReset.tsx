"use client";

import { useEffect } from "react";
import { useLoading } from "./LoadingContext";

interface LoadingContextType {
  setIsLoading: (v: boolean) => void;
}

export default function LoadingReset() {
  const { setIsLoading } = useLoading() as LoadingContextType;

  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);

  return null;
}