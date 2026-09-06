import { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { PictogramButton } from '../shared/PictogramButton';
import { CommunicationRepo, SettingsRepo } from '../../repositories';
import { useCommunicationStore } from '../../store/communicationStore';
import './comunicacion.css';

// Flujo de App §3.1: confirmación visual tras tocar un pictograma —
// mensaje grande, voz opcional (si settings.soundEnabled), registro del
// evento, y salidas sin callejón sin salida ("Volver a Comunicación" /
// "Ir a Inicio" / "Ver qué toca comer hoy", esta última conectada ahora
// que Mi Semana existe desde F3 — corrección post-F4).
export function ConfirmationScreen() {
  const navigate = useNavigate();
  const pictogram = useCommunicationStore((s) => s.selectedPictogram);
  const clearSelection = useCommunicationStore((s) => s.clearSelection);
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!pictogram || loggedRef.current) return;
    loggedRef.current = true;

    CommunicationRepo.logEvent(pictogram.id, pictogram.label);

    SettingsRepo.get('soundEnabled').then((soundEnabled) => {
      if (!soundEnabled) return;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const utterance = new SpeechSynthesisUtterance(pictogram.audioText ?? pictogram.label);
      window.speechSynthesis.speak(utterance);
    });
  }, [pictogram]);

  // Limpiar la selección SOLO al desmontar (no dentro de los onClick) —
  // haciéndolo en el click, este mismo componente todavía montado se
  // re-renderiza con pictogram=null, dispara su propio guard
  // "<Navigate to=/comunicar>" y le gana la carrera a la navegación real
  // (bug encontrado al conectar "Ver qué toca comer hoy" a Mi Semana).
  useEffect(() => {
    return () => clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pictogram) {
    return <Navigate to="/comunicar" replace />;
  }

  return (
    <main className="comunicacion-confirm">
      <p className="comunicacion-confirm__message">{pictogram.label}</p>
      <div className="comunicacion-screen__nav">
        {pictogram.id === 'p-hambre' && (
          <PictogramButton
            icon="i-calendar"
            label="Ver qué toca comer hoy"
            variant="mostaza"
            onClick={() => navigate('/semana')}
          />
        )}
        {pictogram.id === 'p-dolor' && (
          // Flujo de App §8.3: registro rápido pre-rellenado con hora actual
          // y el síntoma GI correspondiente — el usuario completa el resto
          // en el propio formulario de Diario.
          <PictogramButton
            icon="i-diary"
            label="Registrar en Diario"
            variant="mostaza"
            onClick={() =>
              navigate('/diario/nuevo', {
                state: {
                  sourceModule: 'comunicacion',
                  prefill: {
                    time: new Date().toISOString().slice(11, 16),
                    giSymptoms: ['dolor_abdominal'],
                  },
                },
              })
            }
          />
        )}
        {pictogram.id === 'p-textura' && (
          // Flujo de App §8.2: "Cambiar textura" lleva a Comer (Recetario),
          // que ya tiene el selector de textura + "Registrar experiencia"
          // (F2) — se reutiliza ese flujo entero en vez de duplicarlo.
          <PictogramButton
            icon="i-texture"
            label="Cambiar textura"
            variant="mostaza"
            onClick={() => navigate('/comer')}
          />
        )}
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
