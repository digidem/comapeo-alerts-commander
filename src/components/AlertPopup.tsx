import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface MapAlert {
  id: string;
  name: string;
  coordinates: [number, number];
  projectName: string;
  detectionDateStart: string;
  detectionDateEnd: string;
  sourceId: string;
}

interface AlertPopupProps {
  alert: MapAlert;
  onClose: () => void;
}

export const AlertPopup = ({ alert, onClose }: AlertPopupProps) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    if (!dateString) return t("alertPopup.na");
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return t("alertPopup.invalidDate");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">
            {t("alertPopup.title")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label={t("alertPopup.close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600">
              {t("alertPopup.alertName")}
            </p>
            <p className="text-base">{alert.name}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">
              {t("alertPopup.project")}
            </p>
            <p className="text-base">{alert.projectName}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">
              {t("alertPopup.coordinates")}
            </p>
            <p className="text-base font-mono">
              {alert.coordinates[1]}, {alert.coordinates[0]}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">
              {t("alertPopup.detectionPeriod")}
            </p>
            <p className="text-sm">
              <span className="block">
                {t("alertPopup.start", {
                  date: formatDate(alert.detectionDateStart),
                })}
              </span>
              <span className="block">
                {t("alertPopup.end", {
                  date: formatDate(alert.detectionDateEnd),
                })}
              </span>
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">
              {t("alertPopup.sourceId")}
            </p>
            <p className="text-sm font-mono">
              {alert.sourceId || t("alertPopup.na")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
