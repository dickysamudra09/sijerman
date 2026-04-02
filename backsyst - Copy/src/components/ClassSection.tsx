import { CourseCard } from "@/components/CourseCard";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  students: number;
  lessons: number;
}

interface ClassSectionProps {
  className: string;
  courses: Course[];
  onCourseSelect: (courseId: string) => void;
}

export function ClassSection({ className, courses, onCourseSelect }: ClassSectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2">Kelas {className}</h2>
        <p className="text-muted-foreground">
          Pilih course yang sesuai untuk kelas {className}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            id={course.id}
            title={course.title}
            description={course.description}
            duration={course.duration}
            students={course.students}
            lessons={course.lessons}
            onSelect={() => onCourseSelect(course.id)}
          />
        ))}
      </div>
    </div>
  );
}