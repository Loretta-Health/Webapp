import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en', name: 'English', label: 'EN' },
  { code: 'de', name: 'Deutsch', label: 'DE' },
];

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLangCode = i18n.language?.startsWith('de') ? 'de' : 'en';
  const currentLanguage = languages.find(lang => lang.code === currentLangCode) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('loretta_language', languageCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`gap-2 min-h-[44px] min-w-[44px] ${className || ''}`}>
          <Globe className="h-5 w-5" />
          <span className="hidden sm:inline">{currentLanguage.label} {currentLanguage.name}</span>
          <span className="sm:hidden font-semibold text-sm">{currentLanguage.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={currentLangCode === language.code ? 'bg-accent' : ''}
          >
            <span className="mr-2 font-semibold">{language.label}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
