"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowUp, 
  ArrowDown, 
  Reply, 
  Share2, 
  Flag, 
  Calendar,
  Eye,
  ThumbsUp,
  MessageSquare,
  Pin,
  Lock,
  Star,
  MoreHorizontal,
  Send,
  Heart,
  Bookmark
} from "lucide-react";

interface Reply {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: 'student' | 'teacher' | 'admin';
  };
  createdAt: Date;
  votes: number;
  isAccepted?: boolean;
  replies?: Reply[];
}

interface Thread {
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
  replies: Reply[];
  views: number;
  votes: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isSolved?: boolean;
}

const sampleThread: Thread = {
  id: '1',
  title: 'Bagaimana cara menghafal tabel perkalian dengan mudah?',
  content: `Halo teman-teman! 

Saya siswa kelas A-1 dan sedang kesulitan menghafal tabel perkalian. Guru saya sudah mengajarkan berbagai cara tapi saya masih sering lupa, terutama untuk perkalian 7, 8, dan 9.

Ada yang punya tips atau trik khusus yang efektif? Mungkin ada teknik mnemonik atau cara visual yang bisa membantu?

Terima kasih sebelumnya untuk bantuannya! 🙏`,
  author: {
    name: 'Ahmad Pratama',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    role: 'student'
  },
  category: 'matematika',
  tags: ['perkalian', 'tips', 'belajar'],
  createdAt: new Date('2025-01-15T10:30:00'),
  views: 89,
  votes: 8,
  isPinned: true,
  isSolved: true,
  replies: [
    {
      id: 'r1',
      content: `Halo Ahmad! Saya punya beberapa tips yang mungkin bisa membantu:

1. **Teknik Jari untuk Perkalian 9**: Letakkan kedua tangan di depan, tekuk jari ke-n yang ingin dikalikan 9. Jari di sebelah kiri adalah puluhan, sebelah kanan adalah satuan.

2. **Pola Visual**: Buat kartu flashcard warna-warni dengan gambar. Misalnya, 3 x 4 = gambar 3 kotak berisi 4 bintang.

3. **Lagu Perkalian**: Ada banyak lagu perkalian di YouTube yang mudah diingat.

Semoga membantu! 😊`,
      author: {
        name: 'Dr. Sarah Weber',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c87e?w=100&h=100&fit=crop&crop=face',
        role: 'teacher'
      },
      createdAt: new Date('2025-01-15T14:20:00'),
      votes: 12,
      isAccepted: true
    },
    {
      id: 'r2',
      content: `Tambahan dari saya: coba gunakan aplikasi game matematika seperti "Times Tables Rock Stars" atau "Prodigy Math". Belajar sambil bermain lebih menyenangkan dan mudah diingat!`,
      author: {
        name: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        role: 'teacher'
      },
      createdAt: new Date('2025-01-15T16:45:00'),
      votes: 7
    },
    {
      id: 'r3',
      content: `Wah sama nih, saya juga dulu susah banget sama perkalian 8. Yang paling ngebantu sih practice setiap hari minimal 10 menit. Sekarang udah lancar!`,
      author: {
        name: 'Siti Nurhaliza',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
        role: 'student'
      },
      createdAt: new Date('2025-01-16T09:12:00'),
      votes: 3
    }
  ]
};

interface ThreadDetailProps {
  threadId: string;
  onBack: () => void;
  language?: 'id' | 'de';
}

export function ThreadDetail({ threadId, onBack, language = 'id' }: ThreadDetailProps) {
  const [thread] = useState<Thread>(sampleThread);
  const [newReply, setNewReply] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [userVotes, setUserVotes] = useState<{[key: string]: 'up' | 'down' | null}>({});

  const getText = (id: string, de: string) => {
    return language === 'de' ? de : id;
  };

  const handleVote = (id: string, type: 'up' | 'down') => {
    setUserVotes(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type
    }));
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;
    
    setIsSubmittingReply(true);
    
    // Simulate API call
    setTimeout(() => {
      setNewReply('');
      setIsSubmittingReply(false);
    }, 1500);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/95 dark:bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              ← {getText('Kembali ke Forum', 'Zurück zum Forum')}
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Thread Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {thread.isPinned && <Pin className="h-4 w-4 text-blue-600" />}
                  {thread.isLocked && <Lock className="h-4 w-4 text-red-600" />}
                  {thread.isSolved && <Star className="h-4 w-4 text-green-600 fill-current" />}
                  <Badge className="bg-green-100 text-green-800">
                    {thread.category}
                  </Badge>
                  {thread.isSolved && (
                    <Badge className="bg-green-100 text-green-800">
                      ✓ {getText('Terjawab', 'Beantwortet')}
                    </Badge>
                  )}
                </div>
                
                <h1 className="mb-4">{thread.title}</h1>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={thread.author.avatar} />
                      <AvatarFallback className="text-xs">
                        {thread.author.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{thread.author.name}</span>
                    <Badge className={`text-xs ${getRoleColor(thread.author.role)}`}>
                      {getRoleText(thread.author.role)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatTimeAgo(thread.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {thread.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{thread.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{thread.replies.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose prose-sm max-w-none mb-6">
              <div className="whitespace-pre-wrap">{thread.content}</div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(thread.id, 'up')}
                  className={userVotes[thread.id] === 'up' ? 'text-green-600' : ''}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <span className="font-medium">{thread.votes}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(thread.id, 'down')}
                  className={userVotes[thread.id] === 'down' ? 'text-red-600' : ''}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                {getText('Suka', 'Gefällt mir')}
              </Button>
              
              <Button variant="ghost" size="sm">
                <Reply className="h-4 w-4 mr-2" />
                {getText('Balas', 'Antworten')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <div className="space-y-4 mb-8">
          <h3 className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {thread.replies.length} {getText('Balasan', 'Antworten')}
          </h3>

          {thread.replies.map((reply) => (
            <Card key={reply.id} className={reply.isAccepted ? 'border-green-200 bg-green-50/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="flex-shrink-0">
                    <AvatarImage src={reply.author.avatar} />
                    <AvatarFallback>
                      {reply.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{reply.author.name}</span>
                        <Badge className={`text-xs ${getRoleColor(reply.author.role)}`}>
                          {getRoleText(reply.author.role)}
                        </Badge>
                        {reply.isAccepted && (
                          <Badge className="bg-green-100 text-green-800">
                            ✓ {getText('Jawaban Terbaik', 'Beste Antwort')}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="prose prose-sm max-w-none mb-4">
                      <div className="whitespace-pre-wrap">{reply.content}</div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(reply.id, 'up')}
                          className={userVotes[reply.id] === 'up' ? 'text-green-600' : ''}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <span className="font-medium">{reply.votes}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(reply.id, 'down')}
                          className={userVotes[reply.id] === 'down' ? 'text-red-600' : ''}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Reply className="h-4 w-4 mr-2" />
                        {getText('Balas', 'Antworten')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Form */}
        {!thread.isLocked && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Reply className="h-5 w-5" />
                {getText('Tulis Balasan', 'Antwort schreiben')}
              </CardTitle>
              <CardDescription>
                {getText(
                  'Berikan jawaban yang membantu dan konstruktif',
                  'Geben Sie hilfreiche und konstruktive Antworten'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={getText(
                  'Tulis balasan Anda di sini...',
                  'Schreiben Sie Ihre Antwort hier...'
                )}
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="min-h-32"
                maxLength={2000}
              />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {newReply.length}/2000 {getText('karakter', 'Zeichen')}
                </div>
                <Button
                  onClick={handleSubmitReply}
                  disabled={!newReply.trim() || isSubmittingReply}
                >
                  {isSubmittingReply ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {getText('Mengirim...', 'Wird gesendet...')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {getText('Kirim Balasan', 'Antwort senden')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {thread.isLocked && (
          <Card>
            <CardContent className="text-center py-8">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">
                {getText('Thread Dikunci', 'Thread gesperrt')}
              </h3>
              <p className="text-muted-foreground">
                {getText(
                  'Thread ini telah dikunci dan tidak dapat menerima balasan baru',
                  'Dieser Thread wurde gesperrt und kann keine neuen Antworten erhalten'
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}