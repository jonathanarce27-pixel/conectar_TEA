import { ExerciseRepo } from '../../repositories/ExerciseRepo';
import './regulacion.css';

// Flujo de App §5 / Plan de Implementación F4, item 5: contenido real
// extraído de la página "Consejos para la Implementación" del PDF.
export function ImplementationTipsScreen() {
  const tips = ExerciseRepo.getImplementationTips();

  return (
    <main className="regulacion-screen">
      <h1 className="regulacion-screen__title">Consejos para la implementación</h1>
      {tips.length === 0 ? (
        <p>No hay consejos disponibles.</p>
      ) : (
        <ul className="exercise-detail__steps">
          {tips.map((tip) => (
            <li key={tip.title} className="exercise-detail__when" style={{ listStyle: 'none' }}>
              <strong>{tip.title}:</strong> {tip.text}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
