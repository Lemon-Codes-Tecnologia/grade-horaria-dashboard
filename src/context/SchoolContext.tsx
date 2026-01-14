"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { listEscolas, type Escola } from "@/lib/api/escolas";
import { useAuth } from "./AuthContext";

interface SchoolContextType {
  selectedSchool: Escola | null;
  schools: Escola[];
  isLoadingSchools: boolean;
  setSelectedSchool: (school: Escola | null) => void;
  refreshSchools: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const SELECTED_SCHOOL_KEY = "selectedSchoolId";

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [selectedSchool, setSelectedSchoolState] = useState<Escola | null>(null);
  const [schools, setSchools] = useState<Escola[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);

  // Função para buscar escolas do usuário
  const fetchSchools = async () => {
    if (!isAuthenticated) {
      setSchools([]);
      setSelectedSchoolState(null);
      setIsLoadingSchools(false);
      return;
    }

    setIsLoadingSchools(true);
    try {
      const response = await listEscolas({ limit: 100 });
      const schoolList = response.data?.docs || response.payload?.docs || [];
      setSchools(schoolList);

      // Se tem escolas, seleciona uma
      if (schoolList.length > 0) {
        // Tenta carregar a escola salva no localStorage
        const savedSchoolId = localStorage.getItem(SELECTED_SCHOOL_KEY);
        const savedSchool = schoolList.find(s => s._id === savedSchoolId);

        if (savedSchool) {
          setSelectedSchoolState(savedSchool);
        } else {
          // Se não tem escola salva ou não encontrou, usa a primeira
          setSelectedSchoolState(schoolList[0]);
          localStorage.setItem(SELECTED_SCHOOL_KEY, schoolList[0]._id);
        }
      } else {
        setSelectedSchoolState(null);
      }
    } catch (error) {
      console.error("Erro ao buscar escolas:", error);
      setSchools([]);
      setSelectedSchoolState(null);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  // Busca escolas quando o usuário fizer login
  useEffect(() => {
    if (isAuthenticated) {
      fetchSchools();
    } else {
      setSchools([]);
      setSelectedSchoolState(null);
      setIsLoadingSchools(false);
    }
  }, [isAuthenticated]);

  // Função para mudar a escola selecionada
  const setSelectedSchool = (school: Escola | null) => {
    setSelectedSchoolState(school);
    if (school) {
      localStorage.setItem(SELECTED_SCHOOL_KEY, school._id);
    } else {
      localStorage.removeItem(SELECTED_SCHOOL_KEY);
    }
  };

  const refreshSchools = async () => {
    await fetchSchools();
  };

  return (
    <SchoolContext.Provider
      value={{
        selectedSchool,
        schools,
        isLoadingSchools,
        setSelectedSchool,
        refreshSchools,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
}
