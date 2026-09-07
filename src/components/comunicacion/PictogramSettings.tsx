import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunicationRepo } from '../../repositories';
import type { CommunicationCategoryId, CustomPictogram } from '../../db/types';
import './comunicacion.css';
import './PictogramSettings.css';

// Flujo de App §3.4 (cuidador): CRUD de pictogramas personalizados —
// activar/desactivar, añadir alimento nuevo (nombre + foto real desde la
// cámara vía <input type="file" accept="image/*" capture>), quitar.
// No incluye "reordenar arrastrando" en F1 (se resuelve con sortOrder +
// botones subir/bajar, más simple de operar por teclado y de probar).
export function PictogramSettings() {
  const navigate = useNavigate();
  const categories = CommunicationRepo.getCategories();
  const [categoryId, setCategoryId] = useState<CommunicationCategoryId>(categories[0]?.id ?? 'necesidades');
  const [customPictograms, setCustomPictograms] = useState<CustomPictogram[]>([]);
  const [label, setLabel] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);

  const reload = () => {
    CommunicationRepo.getCustomPictogramsByCategory(categoryId).then(setCustomPictograms);
  };

  useEffect(reload, [categoryId]);

  const handlePhotoChange = (file: File | undefined) => {
    if (!file) {
      setPhotoDataUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!label.trim()) return;
    await CommunicationRepo.addCustomPictogram({
      categoryId,
      label: label.trim(),
      icon: '',
      photoDataUrl,
      isActive: true,
      sortOrder: customPictograms.length,
    });
    setLabel('');
    setPhotoDataUrl(undefined);
    reload();
  };

  const handleToggleActive = async (pictogram: CustomPictogram) => {
    await CommunicationRepo.updateCustomPictogram(pictogram.id, { isActive: !pictogram.isActive });
    reload();
  };

  const handleRemove = async (id: string) => {
    await CommunicationRepo.removeCustomPictogram(id);
    reload();
  };

  return (
    <main className="comunicacion-screen">
      <h1 className="comunicacion-screen__title">Configurar pictogramas</h1>

      <label className="pictogram-settings__field">
        Categoría
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value as CommunicationCategoryId)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <ul className="pictogram-settings__list">
        {customPictograms.map((pictogram) => (
          <li key={pictogram.id} className="pictogram-settings__item">
            <span>{pictogram.label}</span>
            <label className="pictogram-settings__toggle">
              <input
                type="checkbox"
                checked={pictogram.isActive}
                onChange={() => handleToggleActive(pictogram)}
              />
              Activo
            </label>
            <button
              type="button"
              className="pictogram-settings__remove"
              onClick={() => handleRemove(pictogram.id)}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>

      <div className="pictogram-settings__add">
        <label className="pictogram-settings__field">
          Nombre del pictograma
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Milanesa de la abuela" />
        </label>
        <label className="pictogram-settings__field">
          Foto (opcional)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handlePhotoChange(e.target.files?.[0])}
          />
        </label>
        <button type="button" className="recipe-detail__action-button" onClick={handleAdd}>
          Añadir alimento nuevo
        </button>
      </div>

      <button type="button" className="recipe-detail__action-button" onClick={() => navigate('/comunicar')}>
        Volver a Comunicación
      </button>
    </main>
  );
}
