import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/shared/AppLayout';
import { RootGate } from './components/shared/RootGate';
import { CommunicationHome } from './components/comunicacion/CommunicationHome';
import { CategoryGrid } from './components/comunicacion/CategoryGrid';
import { ConfirmationScreen } from './components/comunicacion/ConfirmationScreen';
import { EmergencyScreen } from './components/comunicacion/EmergencyScreen';
import { PictogramSettings } from './components/comunicacion/PictogramSettings';
import { RecetarioHome } from './components/recetario/RecetarioHome';
import { RecipeDetail } from './components/recetario/RecipeDetail';
import { JuiceDetail } from './components/recetario/JuiceDetail';
import { PlannerHome } from './components/planificador/PlannerHome';
import { RegulacionHome } from './components/regulacion/RegulacionHome';
import { ExerciseDetail } from './components/regulacion/ExerciseDetail';
import { RoutinePlayer } from './components/regulacion/RoutinePlayer';
import { ImplementationTipsScreen } from './components/regulacion/ImplementationTipsScreen';
import { DiaryHome } from './components/diario/DiaryHome';
import { NewEntryRoute } from './components/diario/NewEntryRoute';
import { HistorialHome } from './components/diario/HistorialHome';
import { EntryDetail } from './components/diario/EntryDetail';
import { AiChatScreen } from './components/ai/AiChatScreen';

// Mapa de navegación (Flujo de App §1). Comunicación+onboarding (F1),
// Recetario+Jugoterapia (F2), Mi Semana (F3), Calmarme (F4), Diario +
// Historial + Resumen (F5), Exportación (F6) y la capa de IA (F7) están
// construidos.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootGate />} />
          <Route path="/comunicar" element={<CommunicationHome />} />
          <Route path="/comunicar/personalizar" element={<PictogramSettings />} />
          <Route path="/comunicar/confirmacion" element={<ConfirmationScreen />} />
          <Route path="/comunicar/:categoryId" element={<CategoryGrid />} />
          <Route path="/ayuda" element={<EmergencyScreen />} />
          <Route path="/comer" element={<RecetarioHome />} />
          <Route path="/comer/receta/:id" element={<RecipeDetail />} />
          <Route path="/comer/jugo/:id" element={<JuiceDetail />} />
          <Route path="/semana" element={<PlannerHome />} />
          <Route path="/calmarme" element={<RegulacionHome />} />
          <Route path="/calmarme/ejercicio/:id" element={<ExerciseDetail />} />
          <Route path="/calmarme/rutina/:id" element={<RoutinePlayer />} />
          <Route path="/calmarme/consejos" element={<ImplementationTipsScreen />} />
          <Route path="/diario" element={<DiaryHome />} />
          <Route path="/diario/nuevo" element={<NewEntryRoute />} />
          <Route path="/diario/historial" element={<HistorialHome />} />
          <Route path="/diario/historial/:id" element={<EntryDetail />} />
          <Route path="/ia" element={<AiChatScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
