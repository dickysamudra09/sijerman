"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  Tags,
  BookOpen,
  Send
} from "lucide-react";

interface CreateThreadProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (thread: any) => void;
  language?: 'id' | 'de';
}

const categories = [
  { id: 'matematika', name: 'Matematika' },
  { id: 'bahasa', name: 'Bahasa' },
  { id: 'ipa', name: 'IPA' },
  { id: 'umum', name: 'Diskusi Umum' },
  { id: 'bantuan', name: 'Bantuan' }
];

const suggestedTags = [
  'tips', 'belajar', 'soal', 'penjelasan', 'diskusi', 'bantuan',
  'matematika', 'bahasa', 'jerman', 'indonesia', 'fisika', 'kimia',
  'biologi', 'grammar', 'vocabulary', 'eksperimen', 'rumus'
];

export function CreateThread({ isOpen, onClose, onSubmit, language = 'id' }: CreateThreadProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getText = (id: string, de: string) => {
    return language === 'de' ? de : id;
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim().toLowerCase()) && tags.length < 5) {
      setTags([...tags, tag.trim().toLowerCase()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      handleAddTag(currentTag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !category) {
      toast.error('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    if (content.trim().length < 20) {
      toast.error('Konten thread minimal 20 karakter');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newThread = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        author: {
          name: 'Current User',
          role: 'student'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        replies: 0,
        views: 0,
        votes: 0
      };

      onSubmit(newThread);
      
      // Reset form
      setTitle('');
      setContent('');
      setCategory('');
      setTags([]);
      setCurrentTag('');
      
      toast.success('Thread berhasil dibuat!');
      onClose();
    } catch (error) {
      toast.error('Gagal membuat thread. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = title.trim() && content.trim() && category && content.trim().length >= 20;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {getText('Buat Thread Baru', 'Neuen Thread erstellen')}
          </DialogTitle>
          <DialogDescription>
            {getText(
              'Mulai diskusi baru dengan komunitas pembelajaran',
              'Starten Sie eine neue Diskussion mit der Lerngemeinschaft'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {getText('Judul Thread', 'Thread-Titel')} *
            </Label>
            <Input
              id="title"
              placeholder={getText(
                'Contoh: Bagaimana cara menghafal rumus matematika?',
                'Beispiel: Wie kann man mathematische Formeln auswendig lernen?'
              )}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {getText('Buat judul yang jelas dan deskriptif', 'Erstellen Sie einen klaren und beschreibenden Titel')}
              </span>
              <span>{title.length}/100</span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>
              {getText('Kategori', 'Kategorie')} *
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder={getText('Pilih kategori thread', 'Thread-Kategorie wählen')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {getText('Isi Thread', 'Thread-Inhalt')} *
            </Label>
            <Textarea
              id="content"
              placeholder={getText(
                'Jelaskan pertanyaan atau topik diskusi Anda dengan detail. Semakin jelas, semakin mudah orang lain membantu!',
                'Erklären Sie Ihre Frage oder Ihr Diskussionsthema im Detail. Je klarer, desto einfacher können andere helfen!'
              )}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32"
              maxLength={2000}
              required
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {getText('Minimal 20 karakter', 'Mindestens 20 Zeichen')}
              </span>
              <span>{content.length}/2000</span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              {getText('Tags', 'Tags')} ({getText('opsional', 'optional')})
            </Label>
            
            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Tag Input */}
            <div className="flex gap-2">
              <Input
                placeholder={getText('Tambah tag...', 'Tag hinzufügen...')}
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={20}
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddTag(currentTag)}
                disabled={!currentTag.trim() || tags.length >= 5}
              >
                {getText('Tambah', 'Hinzufügen')}
              </Button>
            </div>

            {/* Suggested Tags */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {getText('Tag yang disarankan:', 'Vorgeschlagene Tags:')}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags
                  .filter(tag => !tags.includes(tag))
                  .slice(0, 8)
                  .map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(tag)}
                      disabled={tags.length >= 5}
                      className="text-xs"
                    >
                      #{tag}
                    </Button>
                  ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {getText('Maksimal 5 tag. Tag membantu orang lain menemukan thread Anda.', 'Maximal 5 Tags. Tags helfen anderen, Ihren Thread zu finden.')}
            </p>
          </div>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {getText('Panduan Thread', 'Thread-Richtlinien')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{getText('Gunakan judul yang jelas dan spesifik', 'Verwenden Sie klare und spezifische Titel')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{getText('Berikan konteks yang cukup dalam deskripsi', 'Geben Sie ausreichend Kontext in der Beschreibung')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{getText('Pilih kategori yang tepat', 'Wählen Sie die richtige Kategorie')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{getText('Hormati sesama anggota komunitas', 'Respektieren Sie andere Community-Mitglieder')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {getText('Memposting...', 'Wird gepostet...')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {getText('Posting Thread', 'Thread posten')}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {getText('Batal', 'Abbrechen')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}