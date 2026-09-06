import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiaryRepo } from '../../repositories';
import { computeSummary, type DiarySummary } from '../../domain/computeSummary';
import { isoDate, isoDatesInRange, lastNDaysRange } from '../../domain/dateRange';
import { TrendChart } from './TrendChart';
import { ExportModal } from './ExportModal';
import type { DiaryEntry } from '../../db/types';
import './diario.css';

type Tab = 'hoy' | '7dias' | '30dias' | 'completo';

const TABS: { id: Tab; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7dias', label: 'Últimos 7 días' },
  { id: '30dias', label: 'Últimos 30 días' },
  { id: 'completo', label: 'Historial completo' },
];

const PAGE_SIZE = 10;

function entryLabel(entry: DiaryEntry): string {
  return [entry.food, entry.time].filter(Boolean).join(' · ') || 'Registro sin alimento';
}

function EntryList({ entries }: { entries: DiaryEntry[] }) {
  const navigate = useNavigate();
  if (entries.length === 0) {
    return <p className="recetario-empty">No hay registros en este rango.</p>;
  }
  return (
    <div className="diario-entry-list">
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          className="diario-entry-card"
          onClick={() => navigate(`/diario/historial/${entry.id}`)}
        >
          <span className="diario-entry-card__date">
            {entry.date}
            {entry.time ? ` · ${entry.time}` : ''}
          </span>
          <span>{entryLabel(entry)}</span>
        </button>
      ))}
    </div>
  );
}

function SummaryPanel({ summary }: { summary: DiarySummary }) {
  return (
    <div className="diario-summary" aria-label="Resumen del rango">
      <div className="diario-summary__item">
        <div className="diario-summary__value">{summary.mealsLogged}</div>
        <div>Comidas registradas</div>
      </div>
      <div className="diario-summary__item">
        <div className="diario-summary__value">{summary.rejections}</div>
        <div>Rechazos</div>
      </div>
      <div className="diario-summary__item">
        <div className="diario-summary__value">{summary.symptomsRecorded}</div>
        <div>Registros con síntomas</div>
      </div>
      <div className="diario-summary__item">
        <div className="diario-summary__value">{summary.anxietyEpisodes}</div>
        <div>Episodios de ansiedad</div>
      </div>
    </div>
  );
}

// Flujo de App §7.3: 4 vistas sobre la misma tabla diary-entries, cada una
// consultando por el índice `date` con IDBKeyRange (Esquema de Backend §7)
// — nunca un toArray() completo filtrado en memoria.
export interface HistorialHomeProps {
  /** Inyectable solo para pruebas deterministas — en producción siempre "hoy". */
  today?: Date;
}

export function HistorialHome({ today = new Date() }: HistorialHomeProps) {
  const [tab, setTab] = useState<Tab>('hoy');
  const [todayEntries, setTodayEntries] = useState<DiaryEntry[]>([]);
  const [entries7d, setEntries7d] = useState<DiaryEntry[]>([]);
  const [entries30d, setEntries30d] = useState<DiaryEntry[]>([]);
  const [page, setPage] = useState(0);
  const [pageResult, setPageResult] = useState<{ entries: DiaryEntry[]; total: number }>({ entries: [], total: 0 });
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (tab === 'hoy') {
      DiaryRepo.getByDate(isoDate(today)).then(setTodayEntries);
    } else if (tab === '7dias') {
      const range = lastNDaysRange(7, today);
      DiaryRepo.getByDateRange(range.from, range.to).then(setEntries7d);
    } else if (tab === '30dias') {
      const range = lastNDaysRange(30, today);
      DiaryRepo.getByDateRange(range.from, range.to).then(setEntries30d);
    } else if (tab === 'completo') {
      DiaryRepo.getPaginated({ page, pageSize: PAGE_SIZE }).then(setPageResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const range7d = lastNDaysRange(7, today);
  const range30d = lastNDaysRange(30, today);
  const summary7d = computeSummary(entries7d, range7d);
  const summary30d = computeSummary(entries30d, range30d);

  const dailyCounts = isoDatesInRange(range30d.from, range30d.to).map((date) => ({
    date,
    count: entries30d.filter((e) => e.date === date).length,
  }));

  const totalPages = Math.max(1, Math.ceil(pageResult.total / PAGE_SIZE));

  return (
    <main className="diario-screen">
      <h1 className="diario-screen__title">Historial</h1>

      <button type="button" className="recipe-detail__action-button" onClick={() => setShowExport(true)}>
        Exportar
      </button>

      <div className="diario-tabs" role="tablist" aria-label="Vistas de Historial">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setPage(0);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hoy' && <EntryList entries={todayEntries} />}

      {tab === '7dias' && (
        <>
          <SummaryPanel summary={summary7d} />
          <EntryList entries={entries7d} />
        </>
      )}

      {tab === '30dias' && (
        <>
          <TrendChart dailyCounts={dailyCounts} />
          <SummaryPanel summary={summary30d} />
        </>
      )}

      {tab === 'completo' && (
        <>
          <EntryList entries={pageResult.entries} />
          <div className="diario-form__actions">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Página anterior
            </button>
            <span>
              Página {page + 1} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Página siguiente
            </button>
          </div>
        </>
      )}

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </main>
  );
}
