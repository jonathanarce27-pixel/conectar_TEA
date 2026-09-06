import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import './AiButton.css';

// Flujo de App §9: ícono flotante de IA en cualquier pantalla — igual que
// SosButton, vive fuera del árbol de navegación normal. Indicador de
// conexión: sin red, se muestra atenuado con "Necesita conexión" y no
// navega (el resto de la app — F1 a F6 — sigue funcionando igual, con o
// sin internet).
export function AiButton() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!online) {
    return (
      <button type="button" className="ai-button ai-button--offline" disabled aria-label="Necesita conexión">
        <Icon name="i-communicate" size={22} />
        <span className="ai-button__label">Necesita conexión</span>
      </button>
    );
  }

  return (
    <Link to="/ia" className="ai-button" aria-label="Preguntarle a la IA">
      <Icon name="i-communicate" size={22} />
    </Link>
  );
}
