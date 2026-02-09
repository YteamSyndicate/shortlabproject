"use client";
import { createContext, useContext, useState, useMemo } from "react";
import Loading from "@/app/loading";

const LoadingContext = createContext({ 
  setIsLoading: (v: boolean) => {} 
});

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const contextValue = useMemo(() => ({
    setIsLoading: (v: boolean) => setIsLoading(v)
  }), []);

  return (
    <LoadingContext.Provider value={contextValue}>
      {isLoading && (
        <div className="fixed inset-0 z-9999 bg-black">
          <Loading />
        </div>
      )}

      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
        {children}
      </div>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);