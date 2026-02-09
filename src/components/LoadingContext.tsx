"use client";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Loading from "@/app/loading";

const LoadingContext = createContext({ 
  setIsLoading: () => {} 
} as { 
  setIsLoading: (v: boolean) => void 
});

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading) {
      const handle = requestAnimationFrame(() => {
        setIsLoading(false);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [pathname, searchParams, isLoading]);

  const contextValue = useMemo(() => ({
    setIsLoading: (v: boolean) => setIsLoading(v)
  }), []);

  return (
    <LoadingContext.Provider value={contextValue}>
      {isLoading && <Loading />}
      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
        {children}
      </div>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);