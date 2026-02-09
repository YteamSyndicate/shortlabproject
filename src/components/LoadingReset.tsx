"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "./LoadingContext";

export default function LoadingReset() {
  const { setIsLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams, setIsLoading]);

  return null;
}