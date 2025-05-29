
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  // Ensure currentLang stays in sync with i18n.language (in case of external change)
  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const handleChange = (lang: string) => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang).then(() => {
        setCurrentLang(lang);
      }).catch((error) => {
        console.error('Failed to change language:', error);
        // Revert to current language on error
        setCurrentLang(i18n.language);
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-11 min-w-[44px]"
          aria-label={t('language.switchLanguage')}
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            {LANGUAGES.find(l => l.code === currentLang)?.label || t('language.english')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={currentLang}
          onValueChange={handleChange}
        >
          {LANGUAGES.map(lang => (
            <DropdownMenuRadioItem key={lang.code} value={lang.code}>
              {lang.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
