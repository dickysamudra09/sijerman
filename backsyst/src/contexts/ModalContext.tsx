/**
 * Modal Context & Hook
 * Manages modal state: open/close, dirty, tabs, form data
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ModalType = 'lesson' | 'exercise' | 'material' | 'module' | null;
export type ModalMode = 'create' | 'edit';

interface ModalContextType {
  // State
  isOpen: boolean;
  modalType: ModalType;
  mode: ModalMode;
  data: Record<string, any> | null;
  isDirty: boolean;
  activeTab: 'edit' | 'preview';

  // Actions
  openModal: (type: ModalType, mode: ModalMode, data?: Record<string, any>) => void;
  closeModal: () => void;
  setDirty: (dirty: boolean) => void;
  setActiveTab: (tab: 'edit' | 'preview') => void;
  setData: (data: Record<string, any>) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [mode, setMode] = useState<ModalMode>('create');
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const openModal = useCallback(
    (type: ModalType, newMode: ModalMode, initialData?: Record<string, any>) => {
      setModalType(type);
      setMode(newMode);
      setData(initialData || null);
      setIsDirty(false);
      setActiveTab('edit');
      setIsOpen(true);
    },
    []
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear state after animation
    setTimeout(() => {
      setModalType(null);
      setMode('create');
      setData(null);
      setIsDirty(false);
      setActiveTab('edit');
    }, 300);
  }, []);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const value: ModalContextType = {
    isOpen,
    modalType,
    mode,
    data,
    isDirty,
    activeTab,
    openModal,
    closeModal,
    setDirty,
    setActiveTab,
    setData,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
