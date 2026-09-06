import { useNavigate } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import './diario.css';

// Flujo de App §7.1: "MI DIARIO ▸ '+ Nuevo registro'" es la puerta de
// entrada al formulario manual; el Historial vive en su propia pantalla
// (§7.3) para no mezclar "registrar" con "consultar".
export function DiaryHome() {
  const navigate = useNavigate();

  return (
    <main className="diario-screen">
      <h1 className="diario-screen__title">Mi Diario</h1>

      <button type="button" className="recipe-detail__action-button" onClick={() => navigate('/diario/nuevo')}>
        <Icon name="i-plus" size={20} /> Nuevo registro
      </button>
      <button type="button" className="recipe-detail__action-button" onClick={() => navigate('/diario/historial')}>
        <Icon name="i-diary" size={20} /> Ver Historial
      </button>
    </main>
  );
}
