import React, { useState } from 'react';
import { APP_THEMES, getInitialTheme, applyTheme } from '../utils/appTheme';

function ThemeSwitcher() {
  const [theme, setTheme] = useState(getInitialTheme);

  const choose = (id) => {
    setTheme(id);
    applyTheme(id, true);
  };

  return (
    <div className="theme-switcher" role="group" aria-label="Colour theme">
      {APP_THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`theme-dot${theme === t.id ? ' active' : ''}`}
          onClick={() => choose(t.id)}
          aria-label={`${t.name} theme`}
          aria-pressed={theme === t.id}
          title={t.name}
          style={{ '--dot-a': t.swatch[0], '--dot-b': t.swatch[1] }}
        />
      ))}
    </div>
  );
}

export default ThemeSwitcher;
