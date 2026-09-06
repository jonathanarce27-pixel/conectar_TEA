import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { useRecipes } from '../../hooks/useRecipes';
import '../../App.css';

// Accesos de la pantalla de Inicio (Flujo de App §1: "¿Qué necesitas?").
// Las 5 secciones (Comunicar F1, Comer F2, Mi Semana F3, Calmarme F4,
// Mi Diario F5) ya están construidas.
const HOME_ACCESSES = [
  { key: 'comunicar', label: 'Comunicar', icon: 'i-bowl-heart', variant: 'coral', to: '/comunicar' },
  { key: 'comer', label: 'Comer', icon: 'i-glass', variant: 'terracota', to: '/comer' },
  { key: 'calmarme', label: 'Calmarme', icon: 'i-meditate', variant: 'salvia', to: '/calmarme' },
  { key: 'semana', label: 'Mi Semana', icon: 'i-calendar', variant: 'mostaza', to: '/semana' },
  { key: 'diario', label: 'Mi Diario', icon: 'i-diary', variant: 'terracota', to: '/diario' },
] as const;

export function HomeScreen() {
  const recipes = useRecipes();
  const firstRecipe = recipes[0];

  return (
    <main className="home">
      <header className="header-lockup">
        <div className="header-lockup__halo">
          <Icon name="i-bowl-heart" size={36} />
        </div>
        <h1 className="header-lockup__wordmark">Sabores que Conectan con Amor</h1>
      </header>

      <h2 className="home__prompt">¿Qué necesitas?</h2>

      <div className="home__grid">
        {HOME_ACCESSES.map((item) => (
          <Link key={item.key} to={item.to} className={`home-card home-card--${item.variant}`}>
            <Icon name={item.icon} size={32} />
            <span className="home-card__label">{item.label}</span>
          </Link>
        ))}
      </div>

      {firstRecipe && (
        <section className="content-preview" aria-label="Vista previa del recetario">
          <p className="content-preview__title">Del recetario</p>
          <p className="content-preview__name">{firstRecipe.name}</p>
          <p className="content-preview__meta">
            {firstRecipe.category} · {firstRecipe.timeMinutes} min
          </p>
        </section>
      )}
    </main>
  );
}
