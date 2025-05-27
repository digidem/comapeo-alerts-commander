
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    // For now, we only have English, but this prepares for future languages
    const currentLang = i18n.language;
    // In the future, you can add more languages here
    console.log('Current language:', currentLang);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-1 h-11 min-w-[44px]"
      aria-label={t('language.switchLanguage')}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">{t('language.english')}</span>
    </Button>
  );
};
