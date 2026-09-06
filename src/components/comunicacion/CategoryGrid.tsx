import { useNavigate, useParams } from 'react-router-dom';
import { PictogramButton } from '../shared/PictogramButton';
import { usePictogramsForCategory } from '../../hooks/usePictogramsForCategory';
import { CommunicationRepo } from '../../repositories';
import { useCommunicationStore } from '../../store/communicationStore';
import './comunicacion.css';

// Flujo de App §3.1: grilla de pictogramas de la categoría elegida.
export function CategoryGrid() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const selectPictogram = useCommunicationStore((s) => s.selectPictogram);
  const { pictograms, isLoading } = usePictogramsForCategory(categoryId);
  const category = categoryId ? CommunicationRepo.getCategoryById(categoryId) : undefined;

  if (isLoading) return null;

  return (
    <main className="comunicacion-screen">
      <h1 className="comunicacion-screen__title">{category?.label ?? 'Pictogramas'}</h1>
      <div className="comunicacion-screen__grid">
        {pictograms.map((pictogram) => (
          <PictogramButton
            key={pictogram.id}
            icon={pictogram.icon}
            label={pictogram.label}
            variant="coral"
            onClick={() => {
              selectPictogram(pictogram);
              navigate('/comunicar/confirmacion');
            }}
          />
        ))}
      </div>
      <div className="comunicacion-screen__nav">
        <PictogramButton
          icon="i-communicate"
          label="Volver a Comunicación"
          onClick={() => navigate('/comunicar')}
        />
        <PictogramButton icon="i-home" label="Ir a Inicio" onClick={() => navigate('/')} />
      </div>
    </main>
  );
}
