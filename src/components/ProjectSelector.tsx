import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Project {
  projectId: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  isLoading?: boolean;
}

export const ProjectSelector = ({
  projects,
  selectedProject,
  onProjectSelect,
  isLoading = false,
}: ProjectSelectorProps) => {
  const { t } = useTranslation();

  if (projects.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="flex items-center gap-1 h-11 min-w-[44px] max-w-[200px] md:max-w-none"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="hidden sm:inline truncate">
          {t("projects.noProjects")}
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-1 h-11 min-w-[44px] max-w-[200px] md:max-w-none"
        >
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">
            {selectedProject?.name || t("projects.selectProject")}
          </span>
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 max-h-64 overflow-y-auto"
        sideOffset={5}
      >
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.projectId}
            onClick={() => onProjectSelect(project)}
            className={`cursor-pointer ${
              selectedProject?.projectId === project.projectId
                ? "bg-blue-50 text-blue-700"
                : ""
            }`}
          >
            <FolderOpen className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{project.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
