"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Brain,
  History,
  Clock,
  Users,
  BarChart3,
  Eye,
  Save,
  RefreshCw,
  Zap,
  FileText,
  Video,
  Headphones,
  Image,
  Link2,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
} from "lucide-react";

interface TeacherActionPanelProps {
  contentType: "lesson" | "exercise" | "material" | "module";
  data: any;
  onSave: (data: any) => void;
  onPreview: (data: any) => void;
  onPublish?: (data: any) => void;
}

export function TeacherActionPanel({
  contentType,
  data,
  onSave,
  onPreview,
  onPublish,
}: TeacherActionPanelProps) {
  const [activeTab, setActiveTab] = useState("properties");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoSave, setAutoSave] = useState(true);

  const getContentTypeIcon = () => {
    switch (contentType) {
      case "lesson":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "exercise":
        return <Brain className="h-4 w-4 text-green-600" />;
      case "material":
        return <Video className="h-4 w-4 text-orange-600" />;
      case "module":
        return <Settings className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getQuickActions = () => {
    switch (contentType) {
      case "lesson":
        return [
          { icon: <Plus className="h-4 w-4" />, label: "Add Exercise", action: "add-exercise" },
          { icon: <Brain className="h-4 w-4" />, label: "AI Settings", action: "ai-settings" },
          { icon: <Eye className="h-4 w-4" />, label: "Preview", action: "preview" },
        ];
      case "exercise":
        return [
          { icon: <Plus className="h-4 w-4" />, label: "Add Question", action: "add-question" },
          { icon: <Brain className="h-4 w-4" />, label: "AI Feedback", action: "ai-feedback" },
          { icon: <Eye className="h-4 w-4" />, label: "Test", action: "test" },
        ];
      case "material":
        return [
          { icon: <Plus className="h-4 w-4" />, label: "Upload File", action: "upload" },
          { icon: <Link2 className="h-4 w-4" />, label: "Add Link", action: "add-link" },
          { icon: <Eye className="h-4 w-4" />, label: "Preview", action: "preview" },
        ];
      default:
        return [
          { icon: <Plus className="h-4 w-4" />, label: "Add Content", action: "add-content" },
          { icon: <Settings className="h-4 w-4" />, label: "Settings", action: "settings" },
        ];
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getContentTypeIcon()}
            <span className="font-semibold capitalize">{contentType}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {getQuickActions().map((action) => (
            <Button
              key={action.action}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => {
                switch (action.action) {
                  case "preview":
                    onPreview(data);
                    break;
                  case "add-exercise":
                    console.log("Add exercise");
                    break;
                  case "ai-settings":
                    setActiveTab("ai");
                    break;
                  default:
                    console.log("Action:", action.action);
                }
              }}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Content Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={data?.title || ""}
                    onChange={(e) => onSave({ ...data, title: e.target.value })}
                    className="h-8"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={data?.description || ""}
                    onChange={(e) => onSave({ ...data, description: e.target.value })}
                    className="h-8"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="published">Published</Label>
                  <Switch
                    id="published"
                    checked={data?.is_active || false}
                    onCheckedChange={(checked) => onSave({ ...data, is_active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autosave">Auto-save</Label>
                  <Switch
                    id="autosave"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => onPreview(data)}
                >
                  <Eye className="h-4 w-4" />
                  Preview as Student
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => onSave(data)}
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>

                {onPublish && (
                  <Button
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => onPublish(data)}
                  >
                    <Zap className="h-4 w-4" />
                    Publish
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-enabled">AI Feedback</Label>
                  <Switch
                    id="ai-enabled"
                    checked={data?.ai_feedback_enabled || false}
                    onCheckedChange={(checked) => onSave({ ...data, ai_feedback_enabled: checked })}
                  />
                </div>

                {data?.ai_feedback_enabled && (
                  <>
                    <div>
                      <Label htmlFor="ai-type">Feedback Type</Label>
                      <select
                        id="ai-type"
                        value={data?.ai_feedback_type || "instant"}
                        onChange={(e) => onSave({ ...data, ai_feedback_type: e.target.value })}
                        className="w-full h-8 px-3 border rounded text-sm"
                      >
                        <option value="instant">Instant</option>
                        <option value="delayed">Delayed</option>
                        <option value="batch">Batch</option>
                      </select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      Open AI Studio
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>MCQ Template:</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Essay Template:</span>
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Custom Templates:</span>
                    <Badge variant="outline" className="text-xs">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Views</div>
                    <div className="font-semibold">1,234</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Completions</div>
                    <div className="font-semibold">892</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Time</div>
                    <div className="font-semibold">12m</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Success Rate</div>
                    <div className="font-semibold">87%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Lesson completed</span>
                    <span className="text-gray-600">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exercise submitted</span>
                    <span className="text-gray-600">5 min ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Content edited</span>
                    <span className="text-gray-600">12 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Last saved: 2 min ago</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3" />
            <span>Auto-save {autoSave ? "on" : "off"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
