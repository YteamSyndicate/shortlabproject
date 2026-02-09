"use client";
import { createContext, useContext, useState, useMemo } from "react";
import Loading from "@/app/loading";

export interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const contextValue = useMemo(() => ({
    isLoading,
    setIsLoading: (v: boolean) => setIsLoading(v)
  }), [isLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {isLoading && (
        <div className="fixed inset-0 z-9999 bg-black">
           <Loading /> 
        </div>
      )}

      <div className={isLoading ? "opacity-0 invisible h-0" : "opacity-100 transition-opacity duration-300"}>
        {children}
      </div>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("useLoading must be used within a LoadingProvider");
  return context;
};