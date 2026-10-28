import React from 'react';
import { Volume2, VolumeX, RotateCw, Camera, Eye, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeaderBarProps {
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectCameraView: (view: 'front' | 'angled' | 'top' | 'close') => void;
  onSnapshot: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  autoRotate,
  onToggleAutoRotate,
  soundEnabled,
  onToggleSound,
  onSelectCameraView,
  onSnapshot,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-3 sm:p-5 flex flex-wrap items-center justify-between gap-3">
      {/* Brand Badge */}
      <div className="pointer-events-auto flex items-center gap-2.5 bg-stone-900/85 text-stone-100 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-lg border border-stone-800/80 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center text-stone-950 font-black text-sm shadow-inner">
          ☕
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-bold text-base tracking-wide text-stone-100">
              Ziarenko 3D
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
              Speciality
            </span>
          </div>
          <p className="text-[11px] text-stone-400 font-medium">
            Interaktywny konfigurator paczki kawy
          </p>
        </div>
      </div>

      {/* Quick View Controls */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-stone-900/85 text-stone-200 p-1.5 rounded-2xl shadow-lg border border-stone-800/80 backdrop-blur-md text-xs">
        {/* Camera presets */}
        <div className="hidden sm:flex items-center gap-1 border-r border-stone-800 pr-1.5 mr-0.5">
          <button
            onClick={() => {
              sound.playClick();
              onSelectCameraView('front');
            }}
            className="px-2.5 py-1.5 rounded-xl hover:bg-stone-800 text-stone-300 hover:text-white transition-colors flex items-center gap-1 font-medium"
            title="Widok z przodu"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Przód</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectCameraView('angled');
            }}
            className="px-2.5 py-1.5 rounded-xl hover:bg-stone-800 text-stone-300 hover:text-white transition-colors flex items-center gap-1 font-medium"
            title="Widok 45°"
          >
            <span>Półprofil</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectCameraView('top');
            }}
            className="px-2.5 py-1.5 rounded-xl hover:bg-stone-800 text-stone-300 hover:text-white transition-colors flex items-center gap-1 font-medium"
            title="Widok z góry"
          >
            <span>Góra</span>
          </button>
        </div>

        {/* Auto Rotate Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleAutoRotate();
          }}
          className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
            autoRotate
              ? 'bg-amber-600 text-white font-medium'
              : 'hover:bg-stone-800 text-stone-400 hover:text-stone-200'
          }`}
          title={autoRotate ? 'Zatrzymaj obrót' : 'Włącz łagodny obrót'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span className="hidden md:inline text-[11px]">Obrót</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            onToggleSound();
          }}
          className={`p-2 rounded-xl transition-colors ${
            soundEnabled
              ? 'hover:bg-stone-800 text-stone-300'
              : 'bg-stone-800 text-stone-500'
          }`}
          title={soundEnabled ? 'Wycisz dźwięki' : 'Włącz dźwięki fizyki'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Snapshot / Camera capture */}
        <button
          onClick={() => {
            sound.playClick();
            onSnapshot();
          }}
          className="p-2 rounded-xl hover:bg-stone-800 text-stone-300 hover:text-amber-300 transition-colors"
          title="Zrób zdjęcie paczki (Pobierz PNG)"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
