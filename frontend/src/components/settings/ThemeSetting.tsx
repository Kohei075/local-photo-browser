import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../../theme/useTheme';
import { setTheme } from '../../theme/theme';
import type { Theme } from '../../theme/theme';

const themes: { value: Theme; labelKey: 'settings.themeBeige' | 'settings.themeDark' | 'settings.themeLight'; swatch: string }[] = [
  { value: 'beige', labelKey: 'settings.themeBeige', swatch: 'theme-swatch-beige' },
  { value: 'dark', labelKey: 'settings.themeDark', swatch: 'theme-swatch-dark' },
  { value: 'light', labelKey: 'settings.themeLight', swatch: 'theme-swatch-light' },
];

export function ThemeSetting() {
  const { t } = useTranslation();
  const current = useTheme();

  return (
    <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
      <label>{t('settings.themeLabel')}</label>
      <div className="theme-options">
        {themes.map(({ value, labelKey, swatch }) => (
          <button
            key={value}
            className={`theme-option${current === value ? ' active' : ''}`}
            onClick={() => setTheme(value)}
            type="button"
          >
            <span className={`theme-swatch ${swatch}`} />
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
