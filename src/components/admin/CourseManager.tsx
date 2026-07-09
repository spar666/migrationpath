import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GraduationCap,
  MapPin,
  Search,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { courseService, type Course, type CreateCourseDto } from "@/services/courseService";

const regionalCategoryLabel = (cat?: string | null): string | null => {
  switch (cat) {
    case "CATEGORY_2":
      return "Category 2 · Cities & Major Regional Centres";
    case "CATEGORY_3":
      return "Category 3 · Regional Centres & Other Areas";
    case "METRO":
      return "Metropolitan (excluded)";
    case "UNKNOWN":
      return "Unclassified — needs review";
    default:
      return null;
  }
};

export function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegional, setFilterRegional] = useState<string>("all");
  const { toast } = useToast();

  // Fetch courses from API
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        variant: "destructive",
        title: "Error loading courses",
        description: "Failed to load courses from the server.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.anzscoCode.includes(searchQuery);
    const matchesRegional =
      filterRegional === "all" ||
      (filterRegional === "regional" && course.isRegional) ||
      (filterRegional === "metro" && !course.isRegional);
    return matchesSearch && matchesRegional;
  });

  const handleSaveCourse = async () => {
    if (!editingCourse) return;

    if (!editingCourse.universityName.trim() || !editingCourse.courseTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "University name and course title are required.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: CreateCourseDto = {
        universityName: editingCourse.universityName.trim(),
        courseTitle: editingCourse.courseTitle.trim(),
        anzscoCode: editingCourse.anzscoCode.trim(),
        // Occupation title is resolved from the master by code; regional status
        // is derived server-side from the postcode. Neither is sent here.
        campusPostcode: editingCourse.campusPostcode?.trim() || undefined,
        isActive: editingCourse.isActive,
      };

      const isNewCourse = editingCourse.id.startsWith("course-");

      if (isNewCourse) {
        // POST: Create new course
        await courseService.createCourse(payload);
        toast({
          title: "Course Added",
          description: `${editingCourse.courseTitle} has been added successfully.`,
        });
      } else {
        // PATCH: Update existing course
        await courseService.updateCourse(editingCourse.id, payload);
        toast({
          title: "Course Updated",
          description: `${editingCourse.courseTitle} has been updated successfully.`,
        });
      }

      setIsDialogOpen(false);
      setEditingCourse(null);
      await fetchCourses(); // Refresh from server
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save course. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await courseService.deleteCourse(id);
      toast({
        title: "Course Deleted",
        description: "The course has been removed.",
      });
      setDeleteConfirm(null);
      await fetchCourses(); // Refresh from server
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete course. Please try again.",
      });
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (id: string) => {
    const course = courses.find((c) => c.id === id);
    if (!course) return;

    try {
      await courseService.updateCourse(id, { isActive: !course.isActive });
      // Optimistic update
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (error) {
      console.error("Toggle error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to toggle course status.",
      });
    }
  };

  const openAddDialog = () => {
    setEditingCourse({
      id: `course-${Date.now()}`,
      universityName: "",
      courseTitle: "",
      anzscoCode: "",
      campusPostcode: "",
      isRegional: false,
      regionalCategory: null,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse({ ...course });
    setIsDialogOpen(true);
  };

  const regionalCount = courses.filter((c) => c.isRegional && c.isActive).length;
  const activeCount = courses.filter((c) => c.isActive).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Course Manager</h1>
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course Manager</h1>
          <p className="text-muted-foreground">
            Manage education pathways for the Migration Strategy Courses section
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-xs text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gold" />
              <div>
                <p className="text-2xl font-bold">{regionalCount}</p>
                <p className="text-xs text-muted-foreground">Regional (+5 pts)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by university, course, or ANZSCO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRegional} onValueChange={setFilterRegional}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="regional">Regional Only</SelectItem>
            <SelectItem value="metro">Metro Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Education Pathways</CardTitle>
          <CardDescription>
            These courses populate the homepage and student pathway pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {courses.length === 0
                  ? "No courses found. Add your first course to get started."
                  : "No courses match your search criteria."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>ANZSCO</TableHead>
                  <TableHead>Regional</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    className={!course.isActive ? "opacity-50" : ""}
                  >
                    <TableCell className="font-medium">{course.universityName}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{course.courseTitle}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {course.anzscoCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {course.isRegional && (
                        <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                          +5 pts
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={course.isActive}
                        onCheckedChange={() => toggleActive(course.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(course)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteConfirm(course.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCourse?.id.startsWith("course-") ? "Add New Course" : "Edit Course"}
            </DialogTitle>
            <DialogDescription>
              This course will appear in the Migration Strategy Courses section
            </DialogDescription>
          </DialogHeader>
          {editingCourse && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>University Name</Label>
                <Input
                  value={editingCourse.universityName}
                  onChange={(e) =>
                    setEditingCourse((prev) =>
                      prev && { ...prev, universityName: e.target.value }
                    )
                  }
                  placeholder="e.g., University of Melbourne"
                />
              </div>
              <div className="space-y-2">
                <Label>Course Title</Label>
                <Input
                  value={editingCourse.courseTitle}
                  onChange={(e) =>
                    setEditingCourse((prev) =>
                      prev && { ...prev, courseTitle: e.target.value }
                    )
                  }
                  placeholder="e.g., Master of Information Technology"
                />
              </div>
              <div className="space-y-2">
                <Label>ANZSCO Code</Label>
                <Input
                  value={editingCourse.anzscoCode}
                  onChange={(e) =>
                    setEditingCourse((prev) =>
                      prev && { ...prev, anzscoCode: e.target.value }
                    )
                  }
                  placeholder="e.g., 261313"
                />
              </div>
              <div className="space-y-2">
                <Label>Campus Postcode</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={editingCourse.campusPostcode ?? ""}
                    onChange={(e) =>
                      setEditingCourse(
                        (prev) =>
                          prev && {
                            ...prev,
                            campusPostcode: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4),
                          }
                      )
                    }
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="e.g., 3220 (Geelong)"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Regional eligibility is set automatically from this postcode.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Regional Status (auto)</Label>
                <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/30 px-3">
                  <MapPin className="h-4 w-4 shrink-0 text-gold" />
                  {editingCourse.id.startsWith("course-") ? (
                    <span className="text-sm text-muted-foreground">
                      Determined from the postcode on save
                    </span>
                  ) : editingCourse.isRegional ? (
                    <span className="text-sm font-medium text-foreground">
                      Regional (+5 pts)
                      {regionalCategoryLabel(editingCourse.regionalCategory)
                        ? ` — ${regionalCategoryLabel(editingCourse.regionalCategory)}`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {regionalCategoryLabel(editingCourse.regionalCategory) ??
                        "Metropolitan / not regional"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Server-derived. Manual override is disabled.
                </p>
              </div>

              <div className="col-span-2 flex items-center gap-3 pt-2">
                <Switch
                  checked={editingCourse.isActive}
                  onCheckedChange={(checked) =>
                    setEditingCourse((prev) =>
                      prev && { ...prev, isActive: checked }
                    )
                  }
                />
                <Label>Active (visible on site)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveCourse} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This will remove it from the homepage and student pages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteConfirm && handleDeleteCourse(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
