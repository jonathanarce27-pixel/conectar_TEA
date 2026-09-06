import { useNavigate } from 'react-router-dom';
import { PictogramButton } from '../shared/PictogramButton';
import { CommunicationRepo } from '../../repositories';
import { useCommunicationStore } from '../../store/communicationStore';
import './comunicacion.css';

// Tarjeta de ayuda / emergencia (Flujo de App §3.3, PRD secc. 13): SIEMPRE
// exactamente los pictogramas con isEmergency=true del contenido — nunca
// filtrados por las preferencias de "pictogramas desactivados" del
// onboarding (esas solo aplican a las grillas normales de categoría).
export function EmergencyScreen() {
  const navigate = useNavigate();
  const selectPictogram = useCommunicationStore((s) => s.selectPictogram);
  const emergencyPictograms = CommunicationRepo.getEmergencyPictograms();

  return (
    <main className="comunicacion-screen" aria-label="Necesito ayuda">
      <h1 className="comunicacion-screen__title">Necesito ayuda</h1>
      <div className="comunicacion-screen__grid">
        {emergencyPictograms.map((pictogram) => (
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
      <PictogramButton icon="i-home" label="Ir a Inicio" onClick={() => navigate('/')} />
    </main>
  );
}
