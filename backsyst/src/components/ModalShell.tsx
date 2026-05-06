/**
 * Modal Shell Component
 * STEP 2: Reusable context modal with tabs and lifecycle
 * 
 * - Open/close with animation
 * - Dirty state tracking + confirmation on close
 * - Tab system (Edit / Preview)
 * - Placeholder content (to be filled in STEP 3/4)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';
import { Button } from '@/components/ui/button';

interface ModalShellProps {
  // Rendering
  renderEditContent?: (modalType: string | null) => React.ReactNode;
  renderPreviewContent?: (modalType: string | null) => React.ReactNode; // STEP 5: Now receives modalType
  
  // Callbacks
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  
  // State
  isSaving?: boolean;
  isValid?: boolean;
}

export function ModalShell({
  renderEditContent,
  renderPreviewContent,
  onSave,
  onCancel,
  isSaving = false,
  isValid = true,
}: ModalShellProps) {
  const { isOpen, modalType, mode, isDirty, activeTab, setActiveTab, closeModal, setDirty } = useModal();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  // Get modal title based on type and mode
  const getTitle = () => {
    if (!modalType) return 'Modal';
    
    const titles: Record<string, string> = {
      lesson: `${mode === 'create' ? 'Add' : 'Edit'} Lesson`,
      exercise: `${mode === 'create' ? 'Add' : 'Edit'} Exercise`,
      material: `${mode === 'create' ? 'Add' : 'Edit'} Material`,
      module: `${mode === 'create' ? 'Add' : 'Edit'} Module`,
    };
    
    return titles[modalType] || 'Modal';
  };

  // Handle close with dirty state check
  const handleClose = () => {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      closeModal();
    }
  };

  // Confirm discard changes
  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    closeModal();
  };

  // Handle save
  const handleSave = async () => {
    if (!isValid) return;
    
    try {
      setIsSavingLocal(true);
      await onSave?.();
      setDirty(false);
      closeModal();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSavingLocal(true);
    }
  };

  if (!isOpen || !modalType) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        style={{
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
          style={{
            backgroundColor: '#FFFFFC',
            transform: isOpen ? 'scale(1)' : 'scale(0.95)',
            transition: 'transform 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderBottomColor: '#E5E5E5' }}
          >
            <h2 className="text-xl font-bold" style={{ color: '#1A1A1A' }}>
              {getTitle()}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close modal"
            >
              <X className="h-5 w-5" style={{ color: '#6B7280' }} />
            </button>
          </div>

          {/* Tabs */}
          <div
            className="flex border-b"
            style={{ borderBottomColor: '#E5E5E5' }}
          >
            <button
              onClick={() => setActiveTab('edit')}
              className="flex-1 py-3 px-4 font-semibold text-sm border-b-2 transition-colors"
              style={{
                borderBottomColor: activeTab === 'edit' ? '#E8B824' : 'transparent',
                color: activeTab === 'edit' ? '#E8B824' : '#9CA3AF',
              }}
            >
              Edit
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className="flex-1 py-3 px-4 font-semibold text-sm border-b-2 transition-colors"
              style={{
                borderBottomColor: activeTab === 'preview' ? '#E8B824' : 'transparent',
                color: activeTab === 'preview' ? '#E8B824' : '#9CA3AF',
              }}
            >
              Preview
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'edit' && (
              <div className="p-6">
                {renderEditContent ? (
                  renderEditContent(modalType)
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">Edit content placeholder</p>
                    <p className="text-xs text-gray-400 mt-2">
                      (Form component will mount here in STEP 3/4)
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="p-6">
                {renderPreviewContent ? (
                  renderPreviewContent(modalType)
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">Preview placeholder</p>
                    <p className="text-xs text-gray-400 mt-2">
                      (Student view will render here in STEP 5)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4 border-t"
            style={{ borderTopColor: '#E5E5E5' }}
          >
            <div>
              {isDirty && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#F59E0B' }}>
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleClose}
                disabled={isSavingLocal || isSaving}
                className="font-semibold"
                style={{
                  backgroundColor: '#F5F5F5',
                  color: '#1A1A1A',
                  border: '1px solid #E5E5E5',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid || isSavingLocal || isSaving || (mode === 'edit' && !isDirty)}
                className="font-semibold flex items-center gap-2"
                style={{
                  backgroundColor: '#E8B824',
                  color: '#1A1A1A',
                  opacity: !isValid || (mode === 'edit' && !isDirty) ? 0.5 : 1,
                  cursor: !isValid || (mode === 'edit' && !isDirty) ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingLocal || isSaving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-gray-300 border-t-yellow-600 rounded-full animate-spin" />
                    Saving...
                  </>
                ) : mode === 'create' ? (
                  'Create'
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Discard Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto" onClick={() => setShowConfirm(false)} />
          <div
            className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full pointer-events-auto"
            style={{ backgroundColor: '#FFFFFC' }}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: '#1A1A1A' }}>
              Discard changes?
            </h3>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirm(false)}
                className="flex-1 font-semibold"
                style={{
                  backgroundColor: '#F5F5F5',
                  color: '#1A1A1A',
                  border: '1px solid #E5E5E5',
                }}
              >
                Keep Editing
              </Button>
              <Button
                onClick={handleConfirmDiscard}
                className="flex-1 font-semibold"
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
