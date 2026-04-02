"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Filter, 
  Clock, 
  Users, 
  BookOpen, 
  Star,
  RefreshCw
} from "lucide-react";

interface FilterState {
  subjects: string[];
  levels: string[];
  durations: string[];
  ratings: number[];
}

interface ClassFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export function ClassFilter({ onFilterChange }: ClassFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    subjects: [],
    levels: [],
    durations: [],
    ratings: []
  });

  const subjects = [
    { id: 'matematika', label: 'Matematika', count: 8 },
    { id: 'bahasa', label: 'Bahasa', count: 6 },
    { id: 'ipa', label: 'IPA', count: 5 },
    { id: 'ips', label: 'IPS', count: 4 },
    { id: 'seni', label: 'Seni', count: 3 },
    { id: 'olahraga', label: 'Olahraga', count: 2 }
  ];

  const levels = [
    { id: 'pemula', label: 'Pemula', count: 12 },
    { id: 'menengah', label: 'Menengah', count: 8 },
    { id: 'lanjutan', label: 'Lanjutan', count: 4 }
  ];

  const durations = [
    { id: 'short', label: '< 4 minggu', count: 5 },
    { id: 'medium', label: '4-8 minggu', count: 10 },
    { id: 'long', label: '> 8 minggu', count: 7 }
  ];

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    const newSubjects = checked 
      ? [...filters.subjects, subjectId]
      : filters.subjects.filter(s => s !== subjectId);
    
    const newFilters = { ...filters, subjects: newSubjects };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleLevelChange = (levelId: string, checked: boolean) => {
    const newLevels = checked 
      ? [...filters.levels, levelId]
      : filters.levels.filter(l => l !== levelId);
    
    const newFilters = { ...filters, levels: newLevels };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDurationChange = (durationId: string, checked: boolean) => {
    const newDurations = checked 
      ? [...filters.durations, durationId]
      : filters.durations.filter(d => d !== durationId);
    
    const newFilters = { ...filters, durations: newDurations };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRatingChange = (rating: number, checked: boolean) => {
    const newRatings = checked 
      ? [...filters.ratings, rating]
      : filters.ratings.filter(r => r !== rating);
    
    const newFilters = { ...filters, ratings: newRatings };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const newFilters = {
      subjects: [],
      levels: [],
      durations: [],
      ratings: []
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = filters.subjects.length > 0 || 
                          filters.levels.length > 0 || 
                          filters.durations.length > 0 || 
                          filters.ratings.length > 0;

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Course
        </CardTitle>
        <CardDescription>
          Temukan course yang sesuai dengan kebutuhan Anda
        </CardDescription>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="self-start">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Filter
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subjects Filter */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Mata Pelajaran
          </h4>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={subject.id}
                    checked={filters.subjects.includes(subject.id)}
                    onCheckedChange={(checked) => handleSubjectChange(subject.id, checked as boolean)}
                  />
                  <label htmlFor={subject.id} className="text-sm cursor-pointer">
                    {subject.label}
                  </label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {subject.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Levels Filter */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tingkat Kesulitan
          </h4>
          <div className="space-y-2">
            {levels.map((level) => (
              <div key={level.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={level.id}
                    checked={filters.levels.includes(level.id)}
                    onCheckedChange={(checked) => handleLevelChange(level.id, checked as boolean)}
                  />
                  <label htmlFor={level.id} className="text-sm cursor-pointer">
                    {level.label}
                  </label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {level.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Duration Filter */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Durasi Course
          </h4>
          <div className="space-y-2">
            {durations.map((duration) => (
              <div key={duration.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={duration.id}
                    checked={filters.durations.includes(duration.id)}
                    onCheckedChange={(checked) => handleDurationChange(duration.id, checked as boolean)}
                  />
                  <label htmlFor={duration.id} className="text-sm cursor-pointer">
                    {duration.label}
                  </label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {duration.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rating Filter */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Star className="h-4 w-4" />
            Rating Minimum
          </h4>
          <div className="space-y-2">
            {[5, 4, 3].map((rating) => (
              <div key={rating} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={filters.ratings.includes(rating)}
                    onCheckedChange={(checked) => handleRatingChange(rating, checked as boolean)}
                  />
                  <label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex items-center gap-1">
                    {Array.from({ length: rating }, (_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1">& ke atas</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}