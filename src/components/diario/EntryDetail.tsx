import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DiaryRepo } from '../../repositories';
import { DiaryEntryForm } from './DiaryEntryForm';
import type { DiaryEntry } from '../../db/types';
import './diario.css';

// Flujo de App §7.3: "toca un registro individual → ficha de detalle →
// [Editar] [Borrar]". La escala de Bristol se muestra como el número
// elegido solamente — PRD secc. 27: sin ningún texto interpretativo o
// diagnóstico añadido por la UI.
export function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    DiaryRepo.getById(id).then((e) => {
      setEntry(e);
      setLoaded(true);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    await DiaryRepo.remove(id);
    navigate('/diario/historial');
  };

  if (!loaded) return null;

  if (!entry) {
    return (
      <main className="diario-screen">
        <p className="recetario-empty">No encontramos ese registro.</p>
      </main>
    );
  }

  if (editing) {
    return (
      <DiaryEntryForm
        editEntry={entry}
        onSaved={(updated) => {
          setEntry(updated);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <main className="diario-screen">
      <h1 className="diario-screen__title">Registro del {entry.date}</h1>

      <dl>
        {entry.time && (
          <>
            <dt>Hora</dt>
            <dd>{entry.time}</dd>
          </>
        )}
        {entry.food && (
          <>
            <dt>Alimento</dt>
            <dd>{entry.food}</dd>
          </>
        )}
        {entry.quantity && (
          <>
            <dt>Cantidad</dt>
            <dd>{entry.quantity}</dd>
          </>
        )}
        {entry.texture && (
          <>
            <dt>Textura</dt>
            <dd>{entry.texture}</dd>
          </>
        )}
        {entry.place && (
          <>
            <dt>Dónde</dt>
            <dd>{entry.place}</dd>
          </>
        )}
        {entry.company && (
          <>
            <dt>Con quién</dt>
            <dd>{entry.company}</dd>
          </>
        )}
        {entry.behavior && (
          <>
            <dt>Conducta</dt>
            <dd>{entry.behavior}</dd>
          </>
        )}
        {entry.giSymptoms && entry.giSymptoms.length > 0 && (
          <>
            <dt>Síntomas GI</dt>
            <dd>{entry.giSymptoms.join(', ')}</dd>
          </>
        )}
        {entry.bowelMovement && (
          <>
            <dt>Escala de Bristol</dt>
            <dd aria-label={`Tipo ${entry.bowelMovement.bristolType}`}>{entry.bowelMovement.bristolType}</dd>
          </>
        )}
        {entry.emotionBefore && (
          <>
            <dt>Emoción antes</dt>
            <dd>{entry.emotionBefore}</dd>
          </>
        )}
        {entry.emotionAfter && (
          <>
            <dt>Emoción después</dt>
            <dd>{entry.emotionAfter}</dd>
          </>
        )}
        {entry.observations && (
          <>
            <dt>Observaciones</dt>
            <dd>{entry.observations}</dd>
          </>
        )}
      </dl>

      <div className="diario-form__actions">
        <button type="button" className="recipe-detail__action-button" onClick={() => setEditing(true)}>
          Editar
        </button>
        <button type="button" className="recipe-detail__action-button" onClick={handleDelete}>
          Borrar
        </button>
      </div>
    </main>
  );
}
