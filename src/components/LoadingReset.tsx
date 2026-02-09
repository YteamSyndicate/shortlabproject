"use client";
import { useEffect } from "react";
import { useLoading } from "@/components/LoadingContext";

export default function LoadingReset() {
  const { setIsLoading } = useLoading();
  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);
  return null;
}