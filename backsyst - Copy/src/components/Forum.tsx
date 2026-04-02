"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CreateThread } from "@/components/CreateThread";
import { ThreadDetail } from "@/components/ThreadDetail";
import { 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Search, 
  Plus, 
  ArrowUp, 
  ArrowDown,
  Filter,
  Users,
  Eye,
  ChevronRight,
  Pin,
  Lock,
  Star,
  ThumbsUp,
  Reply,
  BookOpen,
  Calendar
} from "lucide-react";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: 'student' | 'teacher' | 'admin';
  };
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  replies: number;
  views: number;
  votes: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isSolved?: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  threads: number;
}

const categories: ForumCategory[] = [
  {
    id: 'matematika',
    name: 'Matematika',
    description: 'Diskusi tentang matematika dasar dan lanjutan',
    color: 'bg-blue-100 text-blue-800',
    threads: 45
  },
  {
    id: 'bahasa',
    name: 'Bahasa',
    description: 'Bahasa Indonesia dan Bahasa Jerman',
    color: 'bg-green-100 text-green-800',
    threads: 32
  },
  {
    id: 'ipa',
    name: 'IPA',
    description: 'Ilmu Pengetahuan Alam',
    color: 'bg-purple-100 text-purple-800',
    threads: 28
  },
  {
    id: 'umum',
    name: 'Diskusi Umum',
    description: 'Topik umum seputar pembelajaran',
    color: 'bg-gray-100 text-gray-800',
    threads: 67
  },
  {
    id: 'bantuan',
    name: 'Bantuan',
    description: 'Pertanyaan teknis dan bantuan',
    color: 'bg-red-100 text-red-800',
    threads: 23
  }
];

const sampleThreads: ForumThread[] = [
  {
    id: '1',
    title: 'Bagaimana cara menghafal tabel perkalian dengan mudah?',
    content: 'Saya kesulitan menghafal tabel perkalian. Ada tips atau trik yang efektif?',
    author: {
      name: 'Ahmad Pratama',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      role: 'student'
    },
    category: 'matematika',
    tags: ['perkalian', 'tips', 'belajar'],
    createdAt: new Date('2025-01-15T10:30:00'),
    updatedAt: new Date('2025-01-16T14:20:00'),
    replies: 12,
    views: 89,
    votes: 8,
    isPinned: true,
    isSolved: true
  },
  {
    id: '2',
    title: 'Diskusi: Perbedaan Akkusativ dan Dativ dalam Bahasa Jerman',
    content: 'Mari diskusikan perbedaan penggunaan kasus Akkusativ dan Dativ dengan contoh-contoh praktis.',
    author: {
      name: 'Dr. Sarah Weber',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c87e?w=100&h=100&fit=crop&crop=face',
      role: 'teacher'
    },
    category: 'bahasa',
    tags: ['jerman', 'grammar', 'kasus'],
    createdAt: new Date('2025-01-14T15:45:00'),
    updatedAt: new Date('2025-01-16T09:12:00'),
    replies: 25,
    views: 156,
    votes: 15,
    isPinned: true
  },
  {
    id: '3',
    title: 'Eksperimen Sederhana untuk Memahami Hukum Newton',
    content: 'Sharing eksperimen-eksperimen sederhana yang bisa dilakukan di rumah untuk memahami hukum Newton.',
    author: {
      name: 'Prof. Budi Santoso',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      role: 'teacher'
    },
    category: 'ipa',
    tags: ['fisika', 'eksperimen', 'newton'],
    createdAt: new Date('2025-01-13T08:20:00'),
    updatedAt: new Date('2025-01-15T16:45:00'),
    replies: 18,
    views: 134,
    votes: 22
  },
  {
    id: '4',
    title: 'Cara mengatasi nervous saat presentasi di kelas',
    content: 'Ada yang punya tips untuk mengatasi rasa gugup saat presentasi? Saya selalu gemetar kalau harus presentasi di depan kelas.',
    author: {
      name: 'Siti Nurhaliza',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      role: 'student'
    },
    category: 'umum',
    tags: ['presentasi', 'tips', 'confidence'],
    createdAt: new Date('2025-01-12T14:30:00'),
    updatedAt: new Date('2025-01-16T11:20:00'),
    replies: 9,
    views: 67,
    votes: 5
  },
  {
    id: '5',
    title: 'Quiz tidak bisa submit, ada error terus',
    content: 'Setiap kali saya coba submit quiz, muncul error "Failed to submit". Sudah coba refresh berkali-kali tapi masih sama. Ada yang mengalami hal serupa?',
    author: {
      name: 'Andi Wijaya',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      role: 'student'
    },
    category: 'bantuan',
    tags: ['bug', 'quiz', 'technical'],
    createdAt: new Date('2025-01-16T09:15:00'),
    updatedAt: new Date('2025-01-16T09:15:00'),
    replies: 3,
    views: 23,
    votes: 1
  }
];

interface ForumProps {
  onBack: () => void;
  language?: 'id' | 'de';
}

type ForumView = 'list' | 'thread' | 'create';

export function Forum({ onBack, language = 'id' }: ForumProps) {
  const [currentView, setCurrentView] = useState<ForumView>('list');
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'votes'>('latest');
  const [threads, setThreads] = useState<ForumThread[]>(sampleThreads);
  const [showCreateThread, setShowCreateThread] = useState(false);

  const getText = (id: string, de: string) => {
    return language === 'de' ? de : id;
  };

  const filteredThreads = threads
    .filter(thread => {
      const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           thread.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || thread.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      switch (sortBy) {
        case 'popular':
          return b.views - a.views;
        case 'votes':
          return b.votes - a.votes;
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

  const handleThreadClick = (threadId: string) => {
    setSelectedThreadId(threadId);
    setCurrentView('thread');
  };

  const handleCreateThread = (newThread: any) => {
    setThreads(prev => [newThread, ...prev]);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedThreadId('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'teacher':
        return getText('Guru', 'Lehrer');
      case 'admin':
        return 'Admin';
      default:
        return getText('Siswa', 'Schüler');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return getText('Baru saja', 'Gerade eben');
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID');
  };

  // Render based on current view
  if (currentView === 'thread') {
    return (
      <ThreadDetail
        threadId={selectedThreadId}
        onBack={handleBackToList}
        language={language}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/95 dark:bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                ← {getText('Kembali', 'Zurück')}
              </Button>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">
                    {getText('Forum Diskusi', 'Diskussionsforum')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {getText('Tempat berdiskusi dan berbagi pengetahuan', 'Ort zum Diskutieren und Wissen teilen')}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowCreateThread(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {getText('Buat Thread', 'Thread erstellen')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {getText('Kategori', 'Kategorien')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory('all')}
                >
                  {getText('Semua Kategori', 'Alle Kategorien')}
                  <Badge variant="secondary" className="ml-auto">
                    {threads.length}
                  </Badge>
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-3 h-3 rounded-full ${category.color.split(' ')[0]}`}></div>
                      <span>{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {category.threads}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Forum Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {getText('Statistik Forum', 'Forum-Statistiken')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {getText('Total Thread', 'Gesamt Threads')}
                  </span>
                  <span className="font-medium">195</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {getText('Anggota Aktif', 'Aktive Mitglieder')}
                  </span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {getText('Thread Hari Ini', 'Threads heute')}
                  </span>
                  <span className="font-medium">8</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={getText("Cari thread, topik, atau tag...", "Threads, Themen oder Tags suchen...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === 'latest' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('latest')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {getText('Terbaru', 'Neueste')}
                    </Button>
                    <Button
                      variant={sortBy === 'popular' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('popular')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {getText('Populer', 'Beliebt')}
                    </Button>
                    <Button
                      variant={sortBy === 'votes' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('votes')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Votes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thread List */}
            <div className="space-y-4">
              {filteredThreads.map((thread) => (
                <Card 
                  key={thread.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleThreadClick(thread.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={thread.author.avatar} />
                        <AvatarFallback>
                          {thread.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {thread.isPinned && (
                                <Pin className="h-4 w-4 text-blue-600" />
                              )}
                              {thread.isLocked && (
                                <Lock className="h-4 w-4 text-red-600" />
                              )}
                              {thread.isSolved && (
                                <Star className="h-4 w-4 text-green-600 fill-current" />
                              )}
                              <h3 className="font-medium hover:text-primary transition-colors">
                                {thread.title}
                              </h3>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {thread.content}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <span>{thread.author.name}</span>
                                <Badge className={`text-xs ${getRoleColor(thread.author.role)}`}>
                                  {getRoleText(thread.author.role)}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatTimeAgo(thread.updatedAt)}</span>
                              </div>

                              <Badge className={categories.find(c => c.id === thread.category)?.color}>
                                {categories.find(c => c.id === thread.category)?.name}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              {thread.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{thread.votes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Reply className="h-4 w-4" />
                                <span>{thread.replies}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{thread.views}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredThreads.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">
                    {getText('Tidak ada thread yang ditemukan', 'Keine Threads gefunden')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {getText(
                      'Coba ubah kata kunci pencarian atau filter kategori',
                      'Versuchen Sie, die Suchbegriffe oder Kategoriefilter zu ändern'
                    )}
                  </p>
                  <Button onClick={() => setShowCreateThread(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {getText('Buat Thread Pertama', 'Ersten Thread erstellen')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Thread Dialog */}
      <CreateThread
        isOpen={showCreateThread}
        onClose={() => setShowCreateThread(false)}
        onSubmit={handleCreateThread}
        language={language}
      />
    </div>
  );
}