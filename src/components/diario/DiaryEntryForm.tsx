import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChipGroup } from '../shared/Chip';
import { RecetarioHome, type PickedItem } from '../recetario/RecetarioHome';
import { DiaryRepo, ProfileRepo } from '../../repositories';
import type {
  BristolType,
  DiaryBehavior,
  DiaryEntry,
  DiaryQuantity,
  DiarySourceModule,
  DiaryTexture,
  Emotion,
  GiSymptom,
} from '../../db/types';
import './diario.css';

const QUANTITY_OPTIONS: { id: DiaryQuantity; label: string }[] = [
  { id: 'poco', label: 'Poco' },
  { id: 'medio', label: 'Medio' },
  { id: 'todo', label: 'Todo' },
];

// DIARY_TEXTURES ('P','T','C','M') no tiene una leyenda documentada en el
// Esquema de Backend ni en el PRD — se infiere P/T/C de los mismos 3
// nombres que ya usa Recipe.textures (pure/trocitos/crocante) y se agrega
// M="Mixta" para una comida real que combinó texturas, que no tiene
// equivalente en Recipe.textures. Decisión de esta fase, reportada como tal.
const TEXTURE_OPTIONS: { id: DiaryTexture; label: string; icon: string }[] = [
  { id: 'P', label: 'Puré', icon: 'i-texture' },
  { id: 'T', label: 'Trocitos', icon: 'i-texture' },
  { id: 'C', label: 'Crocante', icon: 'i-texture' },
  { id: 'M', label: 'Mixta', icon: 'i-texture' },
];

// "Dónde" / "con quién" son campos de texto libre en el esquema (sin enum
// documentado) pero Flujo de App §7.1 pide "chips, no texto libre salvo
// observaciones" — estas listas son un preset de UI que invento para esta
// fase (no vienen de ningún documento fuente), reportado como decisión.
const PLACE_OPTIONS = ['Casa', 'Escuela', 'Casa de familiares', 'Restaurante', 'Otro lugar'];
const COMPANY_OPTIONS = ['Solo', 'Mamá', 'Papá', 'Hermanos', 'Otros cuidadores'];

const BEHAVIOR_OPTIONS: { id: DiaryBehavior; label: string; icon: string }[] = [
  { id: 'tranquilo', label: 'Tranquilo', icon: 'i-meditate' },
  { id: 'inquieto', label: 'Inquieto', icon: 'i-restless' },
  { id: 'ansioso', label: 'Ansioso', icon: 'i-activity' },
  { id: 'cooperativo', label: 'Cooperativo', icon: 'i-thumb-up' },
  { id: 'rechazo', label: 'Rechazo', icon: 'i-thumb-down' },
];

const GI_SYMPTOM_OPTIONS: { id: GiSymptom; label: string; icon?: string }[] = [
  { id: 'dolor_abdominal', label: 'Dolor abdominal', icon: 'i-stomach' },
  { id: 'gases', label: 'Gases' },
  { id: 'reflujo', label: 'Reflujo' },
  { id: 'nauseas', label: 'Náuseas' },
  { id: 'vomitos', label: 'Vómitos' },
  { id: 'estrenimiento', label: 'Estreñimiento' },
  { id: 'diarrea', label: 'Diarrea' },
];

const BRISTOL_TYPES: BristolType[] = [1, 2, 3, 4, 5, 6, 7];

const EMOTION_OPTIONS: { id: Emotion; label: string; icon: string }[] = [
  { id: 'contento', label: 'Contento', icon: 'i-emotion-contento' },
  { id: 'preocupado', label: 'Preocupado', icon: 'i-emotion-preocupado' },
  { id: 'enfadado', label: 'Enfadado', icon: 'i-emotion-enfadado' },
  { id: 'cansado', label: 'Cansado', icon: 'i-emotion-cansado' },
];

export interface DiaryEntryFormPrefill {
  food?: string;
  foodRef?: string;
  quantity?: DiaryQuantity;
  giSymptoms?: GiSymptom[];
  time?: string;
}

export interface DiaryEntryFormProps {
  /** Registro a editar — si se pasa, el formulario actualiza en vez de crear. */
  editEntry?: DiaryEntry;
  /** Campos ya conocidos al llegar desde otro módulo (Flujo de App §7.2). */
  prefill?: DiaryEntryFormPrefill;
  sourceModule?: DiarySourceModule;
  /** Si se pasa, reemplaza la confirmación por defecto (Ver en Historial /
   * Añadir otro registro) — usado por el flujo de edición. */
  onSaved?: (entry: DiaryEntry) => void;
}

// Flujo de App §7.1: formulario visual por pasos (chips, no texto libre
// salvo observaciones). Se implementa como una sola pantalla con 7
// secciones en vez de un wizard paso a paso: todos los campos son
// opcionales salvo la fecha (que se autocompleta), así que forzar
// navegación secuencial entre pasos no aporta nada y complica "completar
// solo lo que falta" cuando el registro ya viene pre-rellenado (§7.2).
export function DiaryEntryForm({ editEntry, prefill, sourceModule = 'manual', onSaved }: DiaryEntryFormProps) {
  const navigate = useNavigate();
  const [food, setFood] = useState(editEntry?.food ?? prefill?.food);
  const [foodRef, setFoodRef] = useState(editEntry?.foodRef ?? prefill?.foodRef);
  const [quantity, setQuantity] = useState<DiaryQuantity | undefined>(editEntry?.quantity ?? prefill?.quantity);
  const [texture, setTexture] = useState<DiaryTexture | undefined>(editEntry?.texture);
  const [place, setPlace] = useState<string | undefined>(editEntry?.place);
  const [company, setCompany] = useState<string | undefined>(editEntry?.company);
  const [behavior, setBehavior] = useState<DiaryBehavior | undefined>(editEntry?.behavior);
  const [hasSymptoms, setHasSymptoms] = useState(
    Boolean(editEntry?.giSymptoms?.length || prefill?.giSymptoms?.length),
  );
  const [giSymptoms, setGiSymptoms] = useState<GiSymptom[]>(editEntry?.giSymptoms ?? prefill?.giSymptoms ?? []);
  const [bristolType, setBristolType] = useState<BristolType | undefined>(editEntry?.bowelMovement?.bristolType);
  const [emotionBefore, setEmotionBefore] = useState<Emotion | undefined>(editEntry?.emotionBefore);
  const [emotionAfter, setEmotionAfter] = useState<Emotion | undefined>(editEntry?.emotionAfter);
  const [observations, setObservations] = useState(editEntry?.observations ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const [savedEntry, setSavedEntry] = useState<DiaryEntry | undefined>(undefined);
  const [acceptedFoodChips, setAcceptedFoodChips] = useState<string[]>([]);

  useEffect(() => {
    ProfileRepo.get().then((profile) => {
      if (!profile) return;
      setAcceptedFoodChips(Array.from(new Set([...profile.acceptedFoods, ...profile.rejectedFoods])));
    });
  }, []);

  const handlePickFood = (item: PickedItem) => {
    setFood(item.name);
    setFoodRef(item.id);
    setShowPicker(false);
  };

  const handleSave = async () => {
    const payload = {
      date: editEntry?.date ?? new Date().toISOString().slice(0, 10),
      time: editEntry?.time ?? prefill?.time,
      food,
      foodRef,
      quantity,
      texture,
      place,
      company,
      behavior,
      giSymptoms: hasSymptoms && giSymptoms.length > 0 ? giSymptoms : undefined,
      bowelMovement: hasSymptoms && bristolType ? { bristolType } : undefined,
      emotionBefore,
      emotionAfter,
      observations: observations.trim() || undefined,
      sourceModule: editEntry?.sourceModule ?? sourceModule,
    };

    const entry = editEntry
      ? await DiaryRepo.update(editEntry.id, payload).then(() => ({ ...editEntry, ...payload }) as DiaryEntry)
      : await DiaryRepo.create(payload);

    if (onSaved) {
      onSaved(entry);
      return;
    }
    setSavedEntry(entry);
  };

  const handleAddAnother = () => {
    setSavedEntry(undefined);
    setFood(undefined);
    setFoodRef(undefined);
    setQuantity(undefined);
    setTexture(undefined);
    setPlace(undefined);
    setCompany(undefined);
    setBehavior(undefined);
    setHasSymptoms(false);
    setGiSymptoms([]);
    setBristolType(undefined);
    setEmotionBefore(undefined);
    setEmotionAfter(undefined);
    setObservations('');
  };

  if (savedEntry) {
    return (
      <main className="diario-screen">
        <p className="modal-confirm-message">Se guardó tu registro.</p>
        <div className="diario-form__actions">
          <button type="button" className="recipe-detail__action-button" onClick={() => navigate('/diario/historial')}>
            Ver en Historial
          </button>
          <button type="button" className="recipe-detail__action-button" onClick={handleAddAnother}>
            Añadir otro registro
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="diario-screen">
      <h1 className="diario-screen__title">{editEntry ? 'Editar registro' : 'Nuevo registro'}</h1>

      <section aria-label="Alimento y cantidad" className="diario-form__section">
        <h2 className="diario-form__section-title">1. Alimento / cantidad</h2>
        {food ? (
          <p className="diario-form__selected-food">
            {food}{' '}
            <button type="button" onClick={() => { setFood(undefined); setFoodRef(undefined); }}>
              Quitar
            </button>
          </p>
        ) : (
          <button type="button" className="recipe-detail__action-button" onClick={() => setShowPicker(true)}>
            Elegir del Recetario
          </button>
        )}
        {acceptedFoodChips.length > 0 && (
          <div className="chip-group__options">
            {acceptedFoodChips.map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                data-selected={food === name || undefined}
                onClick={() => {
                  setFood(name);
                  setFoodRef(undefined);
                }}
                style={{ minHeight: '44px' }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        <ChipGroup
          label="Cantidad"
          options={QUANTITY_OPTIONS}
          values={quantity ? [quantity] : []}
          onChange={(v) => setQuantity(v[0])}
        />
      </section>

      <section aria-label="Textura" className="diario-form__section">
        <h2 className="diario-form__section-title">2. Textura</h2>
        <ChipGroup
          label="Textura"
          options={TEXTURE_OPTIONS}
          values={texture ? [texture] : []}
          onChange={(v) => setTexture(v[0])}
        />
      </section>

      <section aria-label="Dónde y con quién" className="diario-form__section">
        <h2 className="diario-form__section-title">3. Dónde / con quién</h2>
        <ChipGroup
          label="Dónde"
          options={PLACE_OPTIONS.map((p) => ({ id: p, label: p }))}
          values={place ? [place] : []}
          onChange={(v) => setPlace(v[0])}
        />
        <ChipGroup
          label="Con quién"
          options={COMPANY_OPTIONS.map((c) => ({ id: c, label: c }))}
          values={company ? [company] : []}
          onChange={(v) => setCompany(v[0])}
        />
      </section>

      <section aria-label="Conducta" className="diario-form__section">
        <h2 className="diario-form__section-title">4. Conducta</h2>
        <ChipGroup
          label="Conducta"
          options={BEHAVIOR_OPTIONS}
          values={behavior ? [behavior] : []}
          onChange={(v) => setBehavior(v[0])}
        />
      </section>

      <section aria-label="Síntomas digestivos" className="diario-form__section">
        <h2 className="diario-form__section-title">5. Síntomas GI (si aplica)</h2>
        <label className="diario-form__toggle">
          <input
            type="checkbox"
            checked={hasSymptoms}
            onChange={(e) => setHasSymptoms(e.target.checked)}
          />
          ¿Hubo síntomas digestivos?
        </label>
        {hasSymptoms && (
          <>
            <ChipGroup
              label="Síntomas"
              options={GI_SYMPTOM_OPTIONS}
              values={giSymptoms}
              onChange={setGiSymptoms}
              multiple
            />
            <fieldset className="chip-group">
              {/* PRD secc. 27: la escala de Bristol es SOLO una herramienta de
                  registro — se muestra el número elegido, sin ningún texto
                  interpretativo o diagnóstico añadido por la UI. */}
              <legend className="chip-group__label">Escala de Bristol (tipo 1-7)</legend>
              <div className="chip-group__options">
                {BRISTOL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="chip"
                    aria-label={`Tipo ${type}`}
                    data-selected={bristolType === type || undefined}
                    onClick={() => setBristolType(bristolType === type ? undefined : type)}
                    style={{ minHeight: '44px' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}
      </section>

      <section aria-label="Emoción antes y después" className="diario-form__section">
        <h2 className="diario-form__section-title">6. Emoción antes / después</h2>
        <ChipGroup
          label="Antes"
          options={EMOTION_OPTIONS}
          values={emotionBefore ? [emotionBefore] : []}
          onChange={(v) => setEmotionBefore(v[0])}
        />
        <ChipGroup
          label="Después"
          options={EMOTION_OPTIONS}
          values={emotionAfter ? [emotionAfter] : []}
          onChange={(v) => setEmotionAfter(v[0])}
        />
      </section>

      <section aria-label="Observaciones" className="diario-form__section">
        <h2 className="diario-form__section-title">7. Observaciones</h2>
        <label htmlFor="diario-observaciones" className="sr-only">
          Observaciones (texto libre, opcional)
        </label>
        <textarea
          id="diario-observaciones"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Observaciones (opcional)"
        />
      </section>

      <div className="diario-form__actions">
        <button type="button" className="recipe-detail__action-button" onClick={handleSave}>
          Guardar
        </button>
      </div>

      {showPicker && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Elegir alimento">
          <div className="modal-sheet modal-sheet--full">
            <button type="button" className="planner-picker__close" onClick={() => setShowPicker(false)}>
              Cerrar
            </button>
            <RecetarioHome title="¿Qué alimento fue?" onPick={handlePickFood} />
          </div>
        </div>
      )}
    </main>
  );
}
