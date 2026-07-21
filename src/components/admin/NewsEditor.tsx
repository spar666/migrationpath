import { useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Eye,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";

// Local type definitions
interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  personaTag?: string;
  published: boolean;
  publishedDate?: string;
  slug?: string;
  date?: string;
  readTime?: string;
  featured?: boolean;
}

const personaTags = [
  { value: "For Students", label: "For Students" },
  { value: "For Onshore Skilled", label: "For Onshore Skilled" },
  { value: "For Partners", label: "For Partners" },
  { value: "For Employers", label: "For Employers" },
  { value: "All Pathways", label: "All Pathways" },
] as const;

const pathImpactOptions = [
  { value: "none", label: "None (No Dashboard Alert)" },
  { value: "student", label: "Student Dashboard" },
  { value: "onshore-skilled", label: "Onshore Skilled Dashboard" },
  { value: "partner", label: "Partner Dashboard" },
  { value: "employer", label: "Employer Dashboard" },
  { value: "all", label: "All Dashboards" },
] as const;

const categories = [
  "Policy Update",
  "State Nomination",
  "Occupation List",
  "Processing Times",
  "Industry News",
] as const;

type Category = typeof categories[number];
type PersonaTag = typeof personaTags[number]["value"];
type PathImpact = typeof pathImpactOptions[number]["value"];

export function NewsEditor() {
  // TODO: Replace with actual backend API endpoint GET /api/v1/news
  const defaultArticles: NewsArticle[] = [];

  const [articles, setArticles] = useState<NewsArticle[]>(defaultArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveArticle = () => {
    if (!editingArticle) return;

    const existingIndex = articles.findIndex((a) => a.slug === editingArticle.slug);
    if (existingIndex >= 0) {
      setArticles((prev) =>
        prev.map((a, i) => (i === existingIndex ? editingArticle : a))
      );
    } else {
      setArticles((prev) => [editingArticle, ...prev]);
    }

    setIsDialogOpen(false);
    setEditingArticle(null);
    toast({
      title: "Article Saved",
      description: `"${editingArticle.title}" has been saved successfully.`,
    });
  };

  const handleDeleteArticle = (slug: string) => {
    setArticles((prev) => prev.filter((a) => a.slug !== slug));
    setDeleteConfirm(null);
    toast({
      title: "Article Deleted",
      description: "The article has been removed from the News Hub.",
    });
  };

  const openAddDialog = () => {
    setEditingArticle({
      id: `${Date.now()}`,
      slug: `article-${Date.now()}`,
      title: "",
      excerpt: "",
      content: "",
      category: "Policy Update",
      date: new Date().toISOString().split("T")[0],
      readTime: "5 min read",
      personaTag: "All Pathways",
      featured: false,
      pathImpact: "none",
    } as NewsArticle & { pathImpact: string });
    setIsDialogOpen(true);
  };

  const openEditDialog = (article: NewsArticle) => {
    setEditingArticle({ ...article });
    setIsDialogOpen(true);
  };

  const toggleFeatured = (slug: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.slug === slug ? { ...a, featured: !a.featured } : a))
    );
    toast({
      title: "Featured Status Updated",
      description: "The article's featured status has been toggled.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">News Hub Editor</h1>
        <p className="text-muted-foreground">Manage migration news articles and policy updates</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredArticles.map((article) => (
          <Card key={article.slug} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{article.category}</Badge>
                    {article.featured && (
                      <Badge className="bg-accent text-navy text-xs">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base line-clamp-2">{article.title}</CardTitle>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(article)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteConfirm(article.slug)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{article.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{article.date}</span>
                <Badge variant="secondary" className="text-xs">{article.personaTag}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <Switch checked={article.featured} onCheckedChange={() => toggleFeatured(article.slug)} />
                <Label className="text-xs">Featured</Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle?.title ? "Edit Article" : "New Article"}</DialogTitle>
            <DialogDescription>Create or edit news articles</DialogDescription>
          </DialogHeader>
          {editingArticle && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingArticle.title} onChange={(e) => setEditingArticle((prev) => prev && { ...prev, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editingArticle.category} onValueChange={(v: Category) => setEditingArticle((prev) => prev && { ...prev, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Persona</Label>
                  <Select value={editingArticle.personaTag} onValueChange={(v: PersonaTag) => setEditingArticle((prev) => prev && { ...prev, personaTag: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{personaTags.map((tag) => <SelectItem key={tag.value} value={tag.value}>{tag.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea value={editingArticle.excerpt} onChange={(e) => setEditingArticle((prev) => prev && { ...prev, excerpt: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={editingArticle.content} onChange={(e) => setEditingArticle((prev) => prev && { ...prev, content: e.target.value })} rows={10} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Path Impact (Dashboard Alert)</Label>
                <Select 
                  value={(editingArticle as NewsArticle & { pathImpact?: string }).pathImpact || "none"} 
                  onValueChange={(v: PathImpact) => setEditingArticle((prev) => prev && { ...prev, pathImpact: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {pathImpactOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select which dashboard(s) should show this as a Policy Alert</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingArticle.featured} onCheckedChange={(checked) => setEditingArticle((prev) => prev && { ...prev, featured: checked })} />
                <Label>Featured Article</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
            <Button onClick={handleSaveArticle}><Save className="h-4 w-4 mr-2" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => deleteConfirm && handleDeleteArticle(deleteConfirm)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
