import { supabase } from "@/lib/supabase";

export async function getUserCourseAccess(
  userId: string | null,
  courseId: string
): Promise<{
  access: "guest" | "limited" | "full";
  canViewAnalytics: boolean;
  canUseAI: boolean;
  enrollmentType: "free" | "paid" | null;
}> {
  if (!userId) {
    return {
      access: "guest",
      canViewAnalytics: false,
      canUseAI: false,
      enrollmentType: null,
    };
  }

  const { data: enrollment, error } = await supabase
    .from("course_enrollments")
    .select("access_level, enrollment_type")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .single();

  if (error || !enrollment) {
    return {
      access: "guest",
      canViewAnalytics: false,
      canUseAI: false,
      enrollmentType: null,
    };
  }

  const isFree = enrollment.enrollment_type === "free";

  return {
    access: enrollment.access_level as "limited" | "full",
    canViewAnalytics: !isFree, 
    canUseAI: !isFree,
    enrollmentType: enrollment.enrollment_type,
  };
}

export async function canViewModuleContent(
  userId: string | null,
  courseId: string,
  moduleIndex: number 
): Promise<boolean> {
  const access = await getUserCourseAccess(userId, courseId);

  if (access.access === "guest") {
    return moduleIndex <= 2; 
  }

  if (access.access === "limited") {
    return true;
  }

  return true;
}

export async function canUseAIFeedback(
  userId: string | null,
  courseId: string,
  currentAttempts: number = 0
): Promise<{
  canUse: boolean;
  reason?: string;
  attemptsRemaining?: number;
}> {
  const access = await getUserCourseAccess(userId, courseId);

  if (access.access === "guest") {
    return {
      canUse: false,
      reason: "Please register to use AI feedback",
    };
  }

  if (access.access === "limited") {
    const maxAttempts = 2;
    const remaining = maxAttempts - currentAttempts;

    if (remaining <= 0) {
      return {
        canUse: false,
        reason: "Free trial attempts exhausted. Upgrade for unlimited AI feedback.",
        attemptsRemaining: 0,
      };
    }

    return {
      canUse: true,
      attemptsRemaining: remaining,
    };
  }

  return {
    canUse: true,
  };
}

export async function enrollInCourse(
  userId: string,
  courseId: string,
  enrollmentType: "free" | "paid" = "free"
) {
  const accessLevel = enrollmentType === "free" ? "limited" : "full";

  const { data, error } = await supabase
    .from("course_enrollments")
    .insert({
      course_id: courseId,
      user_id: userId,
      enrollment_type: enrollmentType,
      access_level: accessLevel,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to enroll: ${error.message}`);
  }

  return data;
}

export async function getCoursePreviewInfo(courseId: string) {
  const { data: course } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      description,
      teacher_id,
      is_paid,
      users!courses_teacher_id_fkey(id, name, email)
    `
    )
    .eq("id", courseId)
    .single();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  return {
    course,
    modules: modules || [],
    previewModuleCount: 3, 
  };
}
