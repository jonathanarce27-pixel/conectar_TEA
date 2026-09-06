import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import './SosButton.css';

// Acceso rápido de emergencia (Flujo de App §1, PRD secc. 13): vive FUERA
// del árbol de navegación normal — botón flotante fijo, visible en
// cualquier pantalla, no requiere pasar por Comunicación primero.
export function SosButton() {
  return (
    <Link to="/ayuda" className="sos-button" aria-label="Necesito ayuda">
      <Icon name="i-sos" size={28} />
    </Link>
  );
}
