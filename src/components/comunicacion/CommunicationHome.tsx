import { useNavigate } from 'react-router-dom';
import { PictogramButton } from '../shared/PictogramButton';
import { CommunicationRepo } from '../../repositories';
import type { CommunicationCategoryId } from '../../db/types';
import './comunicacion.css';

// Ícono representativo por categoría — el contenido de categorías no trae
// su propio ícono (Esquema de Backend §4.3 solo define id/label).
const CATEGORY_ICONS: Record<CommunicationCategoryId, string> = {
  necesidades: 'i-bowl-heart',
  preferencias: 'i-thumb-up',
  sensaciones: 'i-stomach',
  alimentos: 'i-food',
  ayuda: 'i-sos',
};

// Flujo de App §3.1: INICIO -> "COMUNICAR" -> "¿QUÉ QUIERES DECIR?" (grilla
// de 5 categorías).
export function CommunicationHome() {
  const navigate = useNavigate();
  const categories = CommunicationRepo.getCategories();

  return (
    <main className="comunicacion-screen">
      <h1 className="comunicacion-screen__title">¿Qué quieres decir?</h1>
      <div className="comunicacion-screen__grid">
        {categories.map((category) => (
          <PictogramButton
            key={category.id}
            icon={CATEGORY_ICONS[category.id] ?? 'i-help'}
            label={category.label}
            onClick={() => navigate(`/comunicar/${category.id}`)}
          />
        ))}
      </div>
      <PictogramButton
        icon="i-plus"
        label="Configurar pictogramas"
        variant="salvia"
        onClick={() => navigate('/comunicar/personalizar')}
      />
    </main>
  );
}
