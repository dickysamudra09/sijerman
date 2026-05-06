/**
 * CourseOutlineTree Component
 * Renders hierarchical tree of course modules, lessons, exercises, and materials
 * 
 * STEP 1: Read-only tree with dummy action handlers
 * - Renders correct hierarchy
 * - Shows all node types with appropriate icons
 * - Displays badges (question count, duration, etc)
 * - Supports expand/collapse
 * - Inline rename for lessons (double-click)
 * - Action buttons visible on hover (logging only)
 */

'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  Dumbbell,
  Video,
  Music,
  FileTextIcon,
  Image,
  Link2,
  Plus,
  Trash2,
  Edit2,
  Settings,
} from 'lucide-react';
import { TreeNode } from '@/types/tree';
import { TreeActions } from '@/hooks/useTreeActions';

interface CourseOutlineTreeProps {
  modules: TreeNode[];
  actions: TreeActions;
}

export function CourseOutlineTree({ modules, actions }: CourseOutlineTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const isExpanded = (nodeId: string) => expandedNodes.has(nodeId);

  return (
    <div className="space-y-2">
      {modules.map(module => (
        <TreeNodeRenderer
          key={module.id}
          node={module}
          isExpanded={isExpanded(module.id)}
          onToggleExpand={() => toggleExpand(module.id)}
          actions={actions}
          expandedNodes={expandedNodes}
          onToggleExpandChild={toggleExpand}
          depth={0}
        />
      ))}

      <button
        onClick={() => actions.onAddModule()}
        className="mt-4 w-full py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90"
        style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
      >
        <Plus className="h-4 w-4" />
        Add Module
      </button>
    </div>
  );
}

interface TreeNodeRendererProps {
  node: TreeNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  actions: TreeActions;
  expandedNodes: Set<string>;
  onToggleExpandChild: (nodeId: string) => void;
  depth: number;
}

function TreeNodeRenderer({
  node,
  isExpanded,
  onToggleExpand,
  actions,
  expandedNodes,
  onToggleExpandChild,
  depth,
}: TreeNodeRendererProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);

  const handleRenameSubmit = () => {
    if (node.type === 'lesson' && renameValue !== node.title) {
      actions.onRenameLesson(node.id, renameValue);
    }
    setIsRenaming(false);
    setRenameValue(node.title);
  };

  // Get icon based on node type
  const getIcon = () => {
    switch (node.type) {
      case 'module':
        return <BookOpen className="h-4 w-4 flex-shrink-0" style={{ color: '#E8B824' }} />;
      case 'lesson':
        return <FileText className="h-4 w-4 flex-shrink-0" style={{ color: '#0F766E' }} />;
      case 'exercise':
        return <Dumbbell className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />;
      case 'material': {
        const material = node.data as any;
        switch (material?.material_type) {
          case 'video':
            return <Video className="h-4 w-4 flex-shrink-0" style={{ color: '#2563EB' }} />;
          case 'audio':
            return <Music className="h-4 w-4 flex-shrink-0" style={{ color: '#7C3AED' }} />;
          case 'pdf':
            return <FileTextIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />;
          case 'image':
            return <Image className="h-4 w-4 flex-shrink-0" style={{ color: '#F59E0B' }} />;
          default:
            return <Link2 className="h-4 w-4 flex-shrink-0" style={{ color: '#6B7280' }} />;
        }
      }
      default:
        return null;
    }
  };

  // Get badge for node (count, duration, size, etc)
  const getBadge = () => {
    switch (node.type) {
      case 'exercise-section':
      case 'lesson-section':
      case 'material-section': {
        const section = node.data as any;
        return section.count > 0 ? `${section.count}` : '0';
      }
      case 'exercise': {
        const exercise = node.data as any;
        return `${exercise?.question_count || 0}Q`;
      }
      case 'material': {
        const material = node.data as any;
        if (material?.duration_seconds) {
          const mins = Math.round(material.duration_seconds / 60);
          return `${mins}m`;
        }
        if (material?.file_size_mb) {
          return `${material.file_size_mb}MB`;
        }
        return null;
      }
      default:
        return null;
    }
  };

  // Get action buttons based on node type
  const getActions = (): Array<{ label: string; icon?: any; onClick: () => void; isDanger?: boolean }> => {
    switch (node.type) {
      case 'module':
        return [
          {
            label: 'Add Lesson',
            onClick: () => actions.onAddLesson(node.id),
            icon: Plus,
          },
          {
            label: 'Add Material',
            onClick: () => actions.onAddMaterial(node.id),
            icon: Plus,
          },
          {
            label: 'Edit',
            onClick: () => actions.onEditModule(node.id),
            icon: Edit2,
          },
          {
            label: 'Settings',
            onClick: () => actions.onModuleSettings(node.id),
            icon: Settings,
          },
          {
            label: 'Delete',
            onClick: () => actions.onDeleteModule(node.id),
            isDanger: true,
            icon: Trash2,
          },
        ];
      case 'lesson':
        return [
          {
            label: 'Add Exercise',
            onClick: () => actions.onAddExercise(node.id),
            icon: Plus,
          },
          {
            label: 'Edit',
            onClick: () => actions.onEditLesson(node.id),
            icon: Edit2,
          },
          {
            label: 'Delete',
            onClick: () => actions.onDeleteLesson(node.id),
            isDanger: true,
            icon: Trash2,
          },
        ];
      case 'exercise':
        return [
          {
            label: 'Edit',
            onClick: () => actions.onEditExercise(node.id),
            icon: Edit2,
          },
          {
            label: 'Delete',
            onClick: () => actions.onDeleteExercise(node.id),
            isDanger: true,
            icon: Trash2,
          },
        ];
      case 'material':
        return [
          {
            label: 'Edit',
            onClick: () => actions.onEditMaterial(node.id),
            icon: Edit2,
          },
          {
            label: 'Delete',
            onClick: () => actions.onDeleteMaterial(node.id),
            isDanger: true,
            icon: Trash2,
          },
        ];
      default:
        return [];
    }
  };

  // Determine if section header
  const isSectionHeader =
    node.type === 'lesson-section' ||
    node.type === 'material-section' ||
    node.type === 'exercise-section';

  // Determine if has children to show expand button
  const hasChildren = node.children && node.children.length > 0;

  // Render content
  const renderNodeContent = () => {
    // Section headers (non-interactive visual grouping)
    if (isSectionHeader) {
      const sectionData = node.data as any;
      return (
        <div className="flex items-center gap-2 py-1.5 px-2 text-xs font-bold uppercase tracking-wide opacity-60">
          <span>{node.title}</span>
          <span className="ml-auto text-xs opacity-75">({sectionData.count})</span>
        </div>
      );
    }

    // Regular interactive nodes
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100 group transition-colors">
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className="p-0 hover:bg-gray-200 rounded flex-shrink-0"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {/* Icon */}
        {!isSectionHeader && getIcon()}

        {/* Title (Editable for lessons) */}
        {isRenaming && node.type === 'lesson' ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setIsRenaming(false);
                setRenameValue(node.title);
              }
            }}
            className="flex-1 px-2 py-0.5 text-sm border-2 border-blue-500 rounded bg-white"
            style={{ color: '#1A1A1A' }}
          />
        ) : (
          <span
            className="flex-1 text-sm font-medium text-gray-900 cursor-text"
            onDoubleClick={() => node.type === 'lesson' && setIsRenaming(true)}
            title={node.type === 'lesson' ? 'Double-click to rename' : ''}
          >
            {node.title}
          </span>
        )}

        {/* Badge */}
        {getBadge() && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{
              backgroundColor:
                node.type === 'exercise' ? '#FEE2E2' : node.type === 'material' ? '#E0F2FE' : '#F3F4F6',
              color:
                node.type === 'exercise' ? '#DC2626' : node.type === 'material' ? '#0369A1' : '#374151',
            }}
          >
            {getBadge()}
          </span>
        )}

        {/* Action Buttons (Visible on hover) */}
        <div className="hidden group-hover:flex items-center gap-1 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {getActions()
            .slice(0, 2)
            .map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className="p-1 rounded hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: action.isDanger ? '#FEE2E2' : '#F3F4F6',
                    color: action.isDanger ? '#DC2626' : '#374151',
                  }}
                  title={action.label}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          {getActions().length > 2 && (
            <div className="relative group/more">
              <button
                className="p-1 rounded hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
                title="More actions"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {/* Dropdown menu for additional actions */}
              <div className="absolute right-0 top-full mt-1 hidden group-hover/more:flex flex-col bg-white border border-gray-200 rounded shadow-lg z-10">
                {getActions()
                  .slice(2)
                  .map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.onClick}
                      className="px-3 py-1.5 text-xs font-medium hover:bg-gray-100 whitespace-nowrap text-left"
                      style={{
                        color: action.isDanger ? '#DC2626' : '#374151',
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render children recursively
  const renderChildren = () => {
    if (!isExpanded || !node.children) return null;

    return (
      <div
        className="ml-2 space-y-0 border-l border-gray-300"
        style={{ marginLeft: `${(depth + 1) * 12}px` }}
      >
        {node.children.map(child => (
          <TreeNodeRenderer
            key={child.id}
            node={child}
            isExpanded={expandedNodes.has(child.id)}
            onToggleExpand={() => onToggleExpandChild(child.id)}
            actions={actions}
            expandedNodes={expandedNodes}
            onToggleExpandChild={onToggleExpandChild}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-0">
      {renderNodeContent()}
      {renderChildren()}
    </div>
  );
}
