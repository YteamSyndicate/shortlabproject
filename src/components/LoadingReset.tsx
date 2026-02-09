"use client";
import { useEffect } from "react";
import { useLoading, type LoadingContextType } from "./LoadingContext";

export default function LoadingReset() {
  const { setIsLoading } = useLoading() as LoadingContextType;

  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);

  return null;
}