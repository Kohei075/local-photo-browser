import { useTranslation } from '../../i18n/useTranslation';
import { setLang } from '../../i18n/translations';
import type { Lang } from '../../i18n/translations';

export function LanguageSetting() {
  const { t, lang } = useTranslation();

  return (
    <div className="setting-row">
      <label>{t('settings.langLabel')}</label>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="setting-input"
        style={{ maxWidth: '200px' }}
      >
        <option value="ja">日本語</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
