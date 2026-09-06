import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { ChoicePrompt } from '../shared/ChoicePrompt';
import { RecipePickerModal } from './RecipePickerModal';
import { ShoppingListModal } from './ShoppingListModal';
import { PlannerRepo } from '../../repositories';
import { RecipeRepo } from '../../repositories/RecipeRepo';
import { JuiceRepo } from '../../repositories/JuiceRepo';
import { getIsoWeekId, getMondayOfWeek } from '../../db/isoWeek';
import type { DayOfWeek, MealSlot, PlannerWeek } from '../../db/types';
import type { PickedItem } from '../recetario/RecetarioHome';
import './planificador.css';

const DAYS: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};
const MEALS: MealSlot[] = ['desayuno', 'almuerzo', 'cena', 'tentempie'];
const MEAL_LABELS: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  tentempie: 'Tentempié',
};

const ACCEPTANCE_OPTIONS = [
  { id: 'comio-todo', label: 'Comió todo', icon: 'i-check-circle' },
  { id: 'comio-poco', label: 'Comió un poco', icon: 'i-check-circle' },
  { id: 'no-quiso', label: 'No quiso comer', icon: 'i-stop' },
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Mapea el día de la semana de una fecha real a nuestra clave DayOfWeek
// (lunes=0...domingo=6, a diferencia de Date.getDay() que arranca en domingo).
function dayKeyOf(date: Date): DayOfWeek {
  return DAYS[(date.getDay() + 6) % 7];
}

function slotName(refType: 'recipe' | 'juice' | 'custom', refId: string | undefined, label: string | undefined) {
  if (refType === 'custom') return label ?? 'Comida libre';
  if (!refId) return label ?? '';
  const content = refType === 'recipe' ? RecipeRepo.getById(refId) : JuiceRepo.getById(refId);
  return content?.name ?? label ?? 'Receta no disponible';
}

function slotHref(refType: 'recipe' | 'juice' | 'custom', refId: string | undefined) {
  if (!refId || refType === 'custom') return undefined;
  return refType === 'recipe' ? `/comer/receta/${refId}` : `/comer/jugo/${refId}`;
}

// Flujo de App §6: grilla 7×4 navegable entre semanas, con asignación,
// marcar como realizada, modificar/quitar, lista de la compra derivada y
// "reutilizar semana anterior".
export function PlannerHome() {
  const navigate = useNavigate();
  const [monday, setMonday] = useState(() => getMondayOfWeek());
  const [week, setWeek] = useState<PlannerWeek | undefined>(undefined);
  const [pickerTarget, setPickerTarget] = useState<{ day: DayOfWeek; meal: MealSlot } | null>(null);
  const [acceptanceTarget, setAcceptanceTarget] = useState<{ day: DayOfWeek; meal: MealSlot } | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [reuseMessage, setReuseMessage] = useState<string | null>(null);
  // F5 Parte B: tras "Marcar como realizada" con aceptación != "Comió
  // todo", ofrece ampliar a un registro completo de Diario pre-rellenado
  // con el alimento — sin reemplazar ni romper el guardado del PlannerSlot,
  // que ya ocurrió en handleAcceptance antes de que esto se muestre.
  const [expandOffer, setExpandOffer] = useState<{
    day: DayOfWeek;
    meal: MealSlot;
    food: string;
    foodRef?: string;
    quantity?: 'poco' | 'todo';
  } | null>(null);
  const todayRef = useRef<HTMLElement | null>(null);

  const weekId = getIsoWeekId(monday);
  const today = new Date();
  // "Hoy" solo tiene sentido resaltarlo cuando la semana visible ES la
  // semana actual — si el usuario navegó a otra semana, ningún día coincide.
  const isCurrentWeek = weekId === getIsoWeekId(today);
  const todayKey = isCurrentWeek ? dayKeyOf(today) : null;

  const reload = useCallback(async () => {
    setWeek(await PlannerRepo.getWeek(weekId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Flujo de App §3.1: "Ver qué toca comer hoy" (Comunicación -> Mi
  // Semana) debe dejar el día de hoy visible, no solo técnicamente
  // presente en el DOM — si es domingo, por ejemplo, requeriría scroll.
  useEffect(() => {
    // jsdom (tests) no implementa scrollIntoView — no hace falta en ese
    // entorno, el resaltado visual (planner-day--today) ya se prueba aparte.
    if (todayKey) {
      todayRef.current?.scrollIntoView?.({ block: 'center' });
    }
  }, [todayKey]);

  const handlePick = async (item: PickedItem) => {
    if (!pickerTarget) return;
    await PlannerRepo.assignSlot(weekId, pickerTarget.day, pickerTarget.meal, {
      refType: item.type,
      refId: item.id,
      done: false,
    });
    setPickerTarget(null);
    await reload();
  };

  const handleAcceptance = async (day: DayOfWeek, meal: MealSlot, acceptance: string) => {
    const slot = week?.days[day]?.[meal];
    if (!slot) return;
    await PlannerRepo.assignSlot(weekId, day, meal, {
      ...slot,
      done: true,
      acceptance: acceptance as 'comio-todo' | 'comio-poco' | 'no-quiso',
    });
    setAcceptanceTarget(null);
    await reload();

    if (acceptance !== 'comio-todo') {
      setExpandOffer({
        day,
        meal,
        food: slotName(slot.refType, slot.refId, slot.label),
        foodRef: slot.refType !== 'custom' ? slot.refId : undefined,
        quantity: acceptance === 'comio-poco' ? 'poco' : undefined,
      });
    }
  };

  const handleRemove = async (day: DayOfWeek, meal: MealSlot) => {
    await PlannerRepo.clearSlot(weekId, day, meal);
    await reload();
  };

  const handleReuse = async () => {
    const previousMonday = addDays(monday, -7);
    const previousWeekId = getIsoWeekId(previousMonday);
    const cloned = await PlannerRepo.cloneWeek(previousWeekId, weekId);
    if (!cloned) {
      setReuseMessage('No hay una semana anterior guardada para reutilizar.');
      return;
    }
    setReuseMessage(null);
    await reload();
  };

  const weekLabel = `Semana del ${new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(
    monday,
  )} al ${new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(addDays(monday, 6))}`;

  return (
    <main className="planner-screen">
      <h1 className="planner-screen__title">Mi Semana</h1>

      <div className="planner-nav">
        <button
          type="button"
          className="planner-nav__arrow"
          aria-label="Semana anterior"
          onClick={() => setMonday((m) => addDays(m, -7))}
        >
          ‹
        </button>
        <span className="planner-nav__label">{weekLabel}</span>
        <button
          type="button"
          className="planner-nav__arrow"
          aria-label="Semana siguiente"
          onClick={() => setMonday((m) => addDays(m, 7))}
        >
          ›
        </button>
      </div>

      <div className="planner-actions">
        <button type="button" onClick={handleReuse}>
          <Icon name="i-repeat" size={18} /> Reutilizar semana anterior
        </button>
        <button type="button" onClick={() => setShowShoppingList(true)}>
          <Icon name="i-shopping-cart" size={18} /> Lista de la compra
        </button>
      </div>
      {reuseMessage && <p className="recetario-empty">{reuseMessage}</p>}

      {DAYS.map((day, dayIndex) => (
        <section
          key={day}
          ref={day === todayKey ? todayRef : undefined}
          className={`planner-day${day === todayKey ? ' planner-day--today' : ''}`}
          aria-current={day === todayKey ? 'date' : undefined}
        >
          <h2 className="planner-day__title">
            {DAY_LABELS[day]} · {new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(
              addDays(monday, dayIndex),
            )}
            {day === todayKey && <span className="planner-day__today-badge">Hoy</span>}
          </h2>
          <div className="planner-day__slots">
            {MEALS.map((meal) => {
              const slot = week?.days[day]?.[meal];
              const key = `${day}-${meal}`;

              if (!slot) {
                return (
                  <button
                    key={key}
                    type="button"
                    className="planner-slot planner-slot--empty"
                    onClick={() => setPickerTarget({ day, meal })}
                  >
                    <span className="planner-slot__meal-label">{MEAL_LABELS[meal]}</span>
                    <span>+ Agregar</span>
                  </button>
                );
              }

              const name = slotName(slot.refType, slot.refId, slot.label);
              const href = slotHref(slot.refType, slot.refId);

              return (
                <div key={key} className="planner-slot">
                  <span className="planner-slot__meal-label">{MEAL_LABELS[meal]}</span>
                  {href ? (
                    <Link to={href} className="planner-slot__name">
                      {name}
                    </Link>
                  ) : (
                    <span className="planner-slot__name">{name}</span>
                  )}

                  {slot.acceptance && (
                    <span className="planner-slot__acceptance">
                      {ACCEPTANCE_OPTIONS.find((o) => o.id === slot.acceptance)?.label}
                    </span>
                  )}

                  {expandOffer?.day === day && expandOffer?.meal === meal && (
                    <div className="planner-slot__row">
                      <button
                        type="button"
                        onClick={() =>
                          navigate('/diario/nuevo', {
                            state: {
                              sourceModule: 'planificador',
                              prefill: {
                                food: expandOffer.food,
                                foodRef: expandOffer.foodRef,
                                quantity: expandOffer.quantity,
                              },
                            },
                          })
                        }
                      >
                        <Icon name="i-diary" size={16} /> Ampliar a un registro completo de Diario
                      </button>
                      <button type="button" onClick={() => setExpandOffer(null)}>
                        Ahora no
                      </button>
                    </div>
                  )}

                  {acceptanceTarget?.day === day && acceptanceTarget?.meal === meal ? (
                    <ChoicePrompt
                      question="¿Cómo le fue?"
                      options={ACCEPTANCE_OPTIONS}
                      onSelect={(id) => handleAcceptance(day, meal, id)}
                    />
                  ) : (
                    <div className="planner-slot__row">
                      <button type="button" onClick={() => setAcceptanceTarget({ day, meal })}>
                        <Icon name="i-check-circle" size={16} /> Marcar como realizada
                      </button>
                      <button type="button" onClick={() => setPickerTarget({ day, meal })}>
                        <Icon name="i-edit" size={16} /> Modificar
                      </button>
                      <button type="button" onClick={() => handleRemove(day, meal)}>
                        <Icon name="i-trash" size={16} /> Quitar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {pickerTarget && (
        <RecipePickerModal onPick={handlePick} onClose={() => setPickerTarget(null)} />
      )}
      {showShoppingList && (
        <ShoppingListModal weekId={weekId} onClose={() => setShowShoppingList(false)} />
      )}
    </main>
  );
}
