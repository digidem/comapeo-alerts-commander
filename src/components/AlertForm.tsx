import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copy, CheckCircle, X, Loader } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiService } from "@/services/apiService";
import { Credentials, Project, Coordinates } from "@/types/common";

interface AlertFormProps {
  coordinates: Coordinates;
  selectedProjects: string[];
  credentials: Credentials;
  projects: Project[];
  onBack: () => void;
  onSuccess: () => void;
}

type SubmissionState = "idle" | "loading" | "success" | "error" | "partial";

const getDefaultStartTime = () => {
  const now = new Date();
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultEndTime = () => {
  const now = new Date();
  // Add 1 month safely handling month-end edge cases
  const oneMonthLater = new Date(now);
  const currentDay = now.getDate();

  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  // Handle edge case: if day changed due to month overflow (e.g., Jan 31 -> Mar 3)
  // Set to last day of previous month instead
  if (oneMonthLater.getDate() < currentDay) {
    oneMonthLater.setDate(0); // Sets to last day of previous month
  }

  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = oneMonthLater.getFullYear();
  const month = String(oneMonthLater.getMonth() + 1).padStart(2, "0");
  const day = String(oneMonthLater.getDate()).padStart(2, "0");
  const hours = String(oneMonthLater.getHours()).padStart(2, "0");
  const minutes = String(oneMonthLater.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const AlertForm = ({
  coordinates,
  selectedProjects,
  credentials,
  projects,
  onBack,
  onSuccess,
}: AlertFormProps) => {
  const { t } = useTranslation();
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [endTime, setEndTime] = useState(getDefaultEndTime());
  const [sourceId, setSourceId] = useState("");
  const [alertName, setAlertName] = useState("");
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validateSlug = (value: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value);
  };

  const copyCoordinates = async () => {
    const coordText = `${coordinates.lat}, ${coordinates.lng}`;
    try {
      await navigator.clipboard.writeText(coordText);
      toast.success(t("map.coordinatesCopied"));

      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      toast.error(t("map.failedToCopy"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startTime || !endTime || !sourceId || !alertName) {
      toast.error(t("alert.fillAllFields"));
      return;
    }

    if (!validateSlug(alertName)) {
      toast.error(t("alert.slugFormatError"));
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      toast.error(t("alert.endTimeAfterStart"));
      return;
    }

    setSubmissionState("loading");
    setErrorMessage("");

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const projectId of selectedProjects) {
        try {
          await apiService.createAlert(credentials, projectId, {
            detectionDateStart: start.toISOString(),
            detectionDateEnd: end.toISOString(),
            sourceId,
            metadata: {
              alert_type: alertName,
            },
            geometry: {
              type: "Point",
              coordinates: [coordinates.lng, coordinates.lat],
            },
          });

          successCount++;
        } catch (error) {
          errorCount++;
          console.error(
            `Failed to create alert for project ${projectId}:`,
            error,
          );
        }
      }

      // Determine final state
      if (successCount === selectedProjects.length) {
        setSubmissionState("success");
        toast.success(
          t("alert.successMessage", {
            count: successCount,
            plural: successCount !== 1 ? "s" : "",
          }),
        );

        // Haptic feedback for success
        if ("vibrate" in navigator) {
          navigator.vibrate([50, 100, 50]);
        }

        // Auto-navigate back after success
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (successCount > 0) {
        setSubmissionState("partial");
        setErrorMessage(
          t("alert.partialMessage", {
            successCount,
            successPlural: successCount !== 1 ? "s" : "",
            errorCount,
          }),
        );
      } else {
        setSubmissionState("error");
        setErrorMessage(t("alert.failedMessage"));
      }
    } catch (error) {
      setSubmissionState("error");
      setErrorMessage(t("alert.unexpectedError"));
      console.error("Error creating alerts:", error);
    }
  };

  const getButtonContent = () => {
    switch (submissionState) {
      case "loading":
        return (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            {t("alert.creatingAlerts")}
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            {t("alert.alertCreatedSuccessfully")}
          </>
        );
      case "error":
      case "partial":
        return (
          <>
            <X className="w-4 h-4" />
            {submissionState === "partial"
              ? t("alert.partiallyCompleted")
              : t("alert.creationFailed")}
          </>
        );
      default:
        return t("alert.submitAlert", {
          count: selectedProjects.length,
          plural: selectedProjects.length !== 1 ? "s" : "",
        });
    }
  };

  const getButtonVariant = () => {
    switch (submissionState) {
      case "success":
        return "default";
      case "error":
      case "partial":
        return "destructive";
      default:
        return "default";
    }
  };

  const selectedProjectNames = projects
    .filter((p) => selectedProjects.includes(p.projectId))
    .map((p) => p.name);

  const projectsText =
    selectedProjectNames.length > 2
      ? `${selectedProjectNames.slice(0, 2).join(", ")} ${t("common.and")} ${selectedProjectNames.length - 2} ${t("common.more")}`
      : selectedProjectNames.join(", ");

  return (
    <div
      className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100"
      data-testid="alert-form"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("alert.back")}
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("alert.title")}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("alert.subtitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location & Projects Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("alert.location")}</p>
                  <p
                    className="font-mono text-sm"
                    data-testid="coordinates-display"
                    data-coordinates={`${coordinates.lat},${coordinates.lng}`}
                  >
                    {coordinates.lat}, {coordinates.lng}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCoordinates}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {t("alert.copy")}
                </Button>
              </div>

              <div data-testid="selected-projects-display">
                <p className="text-sm text-gray-600">
                  {t("alert.selectedProjects", {
                    count: selectedProjects.length,
                  })}
                </p>
                <p className="text-sm text-gray-800">{projectsText}</p>
              </div>
            </div>

            {/* Alert Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    {t("alert.detectionStartTime")}
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">{t("alert.detectionEndTime")}</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceId">{t("alert.sourceId")}</Label>
                <Input
                  id="sourceId"
                  type="text"
                  placeholder={t("alert.sourceIdPlaceholder")}
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertName">{t("alert.alertName")}</Label>
                <Input
                  id="alertName"
                  type="text"
                  placeholder={t("alert.alertNamePlaceholder")}
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  className={`h-12 ${!alertName || validateSlug(alertName) ? "" : "border-red-500"}`}
                  required
                />
                <p className="text-sm text-gray-600">
                  {t("alert.slugFormatHelp")}
                </p>
                {alertName && !validateSlug(alertName) && (
                  <p
                    className="text-sm text-red-600"
                    data-testid="alert-validation-error"
                  >
                    {t("alert.invalidFormat")}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div
                  className="bg-red-50 border border-red-200 rounded-lg p-3"
                  data-testid="alert-error-message"
                >
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={
                  submissionState === "loading" || !validateSlug(alertName)
                }
                variant={getButtonVariant()}
                data-testid="alert-submit-button"
              >
                {getButtonContent()}
              </Button>

              {(submissionState === "error" ||
                submissionState === "partial") && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => {
                    setSubmissionState("idle");
                    setErrorMessage("");
                  }}
                  data-testid="alert-retry-button"
                >
                  {t("alert.tryAgain")}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
