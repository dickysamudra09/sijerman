"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  PanelLeft,
  PanelRight,
  Maximize2,
  Minimize2,
  Layout,
  Eye,
  Settings,
  Brain,
  Plus,
  Search,
  Filter,
} from "lucide-react";

interface AdaptiveTeacherLayoutProps {
  children: React.ReactNode;
  moduleNavigator: React.ReactNode;
  actionPanel: React.ReactNode;
}

type LayoutMode = "compact" | "standard" | "wide" | "focus";

export function AdaptiveTeacherLayout({
  children,
  moduleNavigator,
  actionPanel,
}: AdaptiveTeacherLayoutProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("standard");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const getLayoutConfig = (mode: LayoutMode) => {
    switch (mode) {
      case "compact":
        return {
          leftWidth: leftPanelCollapsed ? "48px" : "280px",
          rightWidth: rightPanelCollapsed ? "48px" : "280px",
          showLeftPanel: true,
          showRightPanel: true,
        };
      case "standard":
        return {
          leftWidth: leftPanelCollapsed ? "48px" : "320px",
          rightWidth: rightPanelCollapsed ? "48px" : "320px",
          showLeftPanel: true,
          showRightPanel: true,
        };
      case "wide":
        return {
          leftWidth: leftPanelCollapsed ? "48px" : "320px",
          rightWidth: rightPanelCollapsed ? "48px" : "400px",
          showLeftPanel: true,
          showRightPanel: true,
        };
      case "focus":
        return {
          leftWidth: "0px",
          rightWidth: rightPanelCollapsed ? "48px" : "400px",
          showLeftPanel: false,
          showRightPanel: true,
        };
      default:
        return {
          leftWidth: "320px",
          rightWidth: "320px",
          showLeftPanel: true,
          showRightPanel: true,
        };
    }
  };

  const config = getLayoutConfig(layoutMode);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Layout</span>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {["compact", "standard", "wide", "focus"].map((mode) => (
              <Button
                key={mode}
                variant={layoutMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setLayoutMode(mode as LayoutMode)}
                className="h-7 px-3 text-xs capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Quick Add
            </Button>
          </div>

          {/* Panel Toggles */}
          {config.showLeftPanel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="p-2"
            >
              {leftPanelCollapsed ? (
                <PanelRight className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {config.showRightPanel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="p-2"
            >
              {rightPanelCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Module Navigator */}
        {config.showLeftPanel && (
          <div
            className="bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300"
            style={{ width: config.leftWidth }}
          >
            {leftPanelCollapsed ? (
              <div className="p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftPanelCollapsed(false)}
                  className="w-full"
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                {moduleNavigator}
              </div>
            )}
          </div>
        )}

        {/* Center - Content Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Course Name</span>
              <span>/</span>
              <span>Module Name</span>
              <span>/</span>
              <span className="font-medium text-gray-900">Content Type</span>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {showPreview ? (
              <div className="h-full flex items-center justify-center">
                <Card className="w-full max-w-4xl mx-4">
                  <CardContent className="p-8">
                    <div className="text-center text-gray-500">
                      <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Preview Mode</h3>
                      <p>Student preview will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              children
            )}
          </div>
        </div>

        {/* Right Panel - Action Panel */}
        {config.showRightPanel && (
          <div
            className="bg-white border-l border-gray-200 flex-shrink-0 transition-all duration-300"
            style={{ width: config.rightWidth }}
          >
            {rightPanelCollapsed ? (
              <div className="p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelCollapsed(false)}
                  className="w-full"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                {actionPanel}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-gray-800 text-white flex items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-4">
          <span>Layout: {layoutMode}</span>
          <span>•</span>
          <span>Auto-saved</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-xs">
            3 modules • 12 lessons • 8 exercises
          </Badge>
          <span>Last saved: 2 min ago</span>
        </div>
      </div>
    </div>
  );
}
