import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiService } from "@/services/apiService";
import { Credentials, Project } from "@/types/common";

interface ProjectSelectionProps {
  credentials: Credentials;
  onProjectsSelected: (projectIds: string[]) => void;
  onBack: () => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  onLogout?: () => void;
  defaultSelectedProjectId?: string | null;
}

export const ProjectSelection = ({
  credentials,
  onProjectsSelected,
  onBack,
  projects,
  setProjects,
  onLogout,
  defaultSelectedProjectId,
}: ProjectSelectionProps) => {
  const { t } = useTranslation();
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    defaultSelectedProjectId ? [defaultSelectedProjectId] : [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (projects.length > 0) {
        console.log(
          "Projects already loaded, skipping fetch in ProjectSelection",
        );
        return; // Already loaded
      }

      setLoading(true);
      try {
        const fetchedProjects = await apiService.fetchProjects(credentials);
        setProjects(fetchedProjects);
        toast.success(
          t("projects.foundProjects", { count: fetchedProjects.length }),
        );
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error(t("projects.failedToFetch"));
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [credentials, projects.length, setProjects, t]);

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const handleContinue = () => {
    if (selectedProjects.length === 0) {
      toast.error(t("projects.pleaseSelectAtLeast"));
      return;
    }
    onProjectsSelected(selectedProjects);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p>{t("projects.loadingProjects")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No projects state - hide map interface entirely
  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl font-bold">
              {t("projects.noProjectsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">{t("projects.noProjectsMessage")}</p>
            <div className="space-y-2">
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  {t("projects.backToMap")}
                </span>
              </Button>
              {onLogout && (
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="w-full h-12 text-base"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">
                    {t("projects.logout")}
                  </span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile-first header */}
      <div
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t("projects.backToMap")}</span>
          </Button>
          {onLogout && (
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t("projects.logout")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content area with mobile padding */}
      <div className="p-4 pb-safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold text-center">
                {t("projects.title")}
              </CardTitle>
              <p className="text-center text-gray-600 text-sm md:text-base">
                {t("projects.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.projectId}
                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors min-h-[60px]"
                  >
                    <Checkbox
                      id={project.projectId}
                      checked={selectedProjects.includes(project.projectId)}
                      onCheckedChange={() =>
                        handleProjectToggle(project.projectId)
                      }
                      className="scale-125"
                    />
                    <Label
                      htmlFor={project.projectId}
                      className="flex-1 text-sm md:text-base font-medium cursor-pointer"
                    >
                      {project.name}
                    </Label>
                  </div>
                ))}
              </div>

              {selectedProjects.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-3">
                    {t("projects.selected", {
                      count: selectedProjects.length,
                      plural: selectedProjects.length !== 1 ? "s" : "",
                    })}
                  </p>
                  <ul className="text-sm text-green-600 space-y-1">
                    {selectedProjects.map((projectId) => {
                      const project = projects.find(
                        (p) => p.projectId === projectId,
                      );
                      return <li key={projectId}>• {project?.name}</li>;
                    })}
                  </ul>
                </div>
              )}

              <Button
                onClick={handleContinue}
                className="w-full mt-6 h-12 text-base"
                disabled={selectedProjects.length === 0}
              >
                {t("projects.continueToAlert", {
                  count: selectedProjects.length,
                })}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
