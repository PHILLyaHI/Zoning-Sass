"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { PropertyRecord, LayerState } from "../lib/types";
import { 
  getAllProperties, 
  getProperty, 
  saveProperty, 
  deleteProperty,
} from "../lib/propertyStore";
import { lookupProperty } from "../lib/propertyService";
import { useAuth } from "./AuthContext";

type PropertyContextType = {
  properties: PropertyRecord[];
  currentProperty: PropertyRecord | null;
  isLoading: boolean;
  searchError: string | null;
  
  // Actions
  loadProperties: () => void;
  loadProperty: (id: string) => PropertyRecord | null;
  searchProperty: (address: string) => Promise<PropertyRecord | null>;
  updateProperty: (property: PropertyRecord) => PropertyRecord;
  removeProperty: (id: string) => boolean;
  setCurrentProperty: (property: PropertyRecord | null) => void;
  toggleLayer: (layerId: string) => void;
};

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [currentProperty, setCurrentProperty] = useState<PropertyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load properties when user changes
  const loadProperties = useCallback(() => {
    if (!user) {
      setProperties([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const userProperties = getAllProperties(user.id);
    setProperties(userProperties);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const loadProperty = useCallback((id: string): PropertyRecord | null => {
    const property = getProperty(id);
    if (property) {
      setCurrentProperty(property);
    }
    return property;
  }, []);

  // New: Search property using API routes
  const searchProperty = useCallback(async (address: string): Promise<PropertyRecord | null> => {
    if (!user) {
      setSearchError("You must be logged in to search properties");
      return null;
    }

    setIsLoading(true);
    setSearchError(null);

    try {
      // Call the property service which uses our API routes
      const property = await lookupProperty(address);
      
      if (!property) {
        setSearchError("Property not found. Please check the address and try again.");
        setIsLoading(false);
        return null;
      }

      // Add user ID and save
      property.userId = user.id;
      const saved = saveProperty(property);
      
      // Update state
      setProperties(prev => [...prev, saved]);
      setCurrentProperty(saved);
      setIsLoading(false);
      
      return saved;
    } catch (error) {
      console.error("Property search error:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to search property");
      setIsLoading(false);
      return null;
    }
  }, [user]);

  const updateProperty = useCallback((property: PropertyRecord): PropertyRecord => {
    const updated = saveProperty(property);
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (currentProperty?.id === updated.id) {
      setCurrentProperty(updated);
    }
    return updated;
  }, [currentProperty]);

  const removeProperty = useCallback((id: string): boolean => {
    const success = deleteProperty(id);
    if (success) {
      setProperties(prev => prev.filter(p => p.id !== id));
      if (currentProperty?.id === id) {
        setCurrentProperty(null);
      }
    }
    return success;
  }, [currentProperty]);

  // Toggle a map layer on/off
  const toggleLayer = useCallback((layerId: string) => {
    if (!currentProperty) return;
    
    const updatedLayers = (currentProperty.layers || []).map((layer: LayerState) =>
      layer.id === layerId ? { ...layer, active: !layer.active } : layer
    );
    
    const updated = {
      ...currentProperty,
      layers: updatedLayers,
      updatedAt: new Date(),
    };
    
    const saved = saveProperty(updated);
    setCurrentProperty(saved);
    setProperties(prev => prev.map(p => p.id === saved.id ? saved : p));
  }, [currentProperty]);

  const value: PropertyContextType = {
    properties,
    currentProperty,
    isLoading,
    searchError,
    loadProperties,
    loadProperty,
    searchProperty,
    updateProperty,
    removeProperty,
    setCurrentProperty,
    toggleLayer,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error("useProperties must be used within a PropertyProvider");
  }
  return context;
}
