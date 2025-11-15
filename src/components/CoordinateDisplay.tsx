import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MapPin, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Coordinates } from "@/types/common";

interface CoordinateDisplayProps {
  coordinates: Coordinates;
  onContinue: () => void;
  onCancel: () => void;
}

export const CoordinateDisplay = ({
  coordinates,
  onContinue,
  onCancel,
}: CoordinateDisplayProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Content component shared between mobile and desktop
  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-lg">
            {t("map.selectedLocation")}
          </p>
          <p
            className="text-sm text-gray-600 truncate"
            role="region"
            aria-label="Selected coordinates"
          >
            <span>Lat: {coordinates.lat}</span>,{" "}
            <span>Lng: {coordinates.lng}</span>
          </p>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 h-12 min-w-[44px]"
          aria-label="Cancel"
        >
          <X className="w-4 h-4 mr-2" />
          {t("common.cancel")}
        </Button>
        <Button
          onClick={onContinue}
          className="flex-1 bg-green-600 hover:bg-green-700 h-12 font-medium"
          aria-label="Continue to project selection"
        >
          {t("map.continue")}
        </Button>
      </div>
    </div>
  );

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <BottomSheet isOpen={true} onClose={onCancel}>
        {content}
      </BottomSheet>
    );
  }

  // Desktop: Floating card
  return (
    <div
      className="absolute left-4 right-4 z-10 md:left-6 md:right-auto md:w-auto"
      style={{ bottom: `max(80px, calc(env(safe-area-inset-bottom) + 80px))` }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 animate-fade-in">
        {content}
      </div>
    </div>
  );
};
