/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { COFFEE_ORIGINS } from './constants/coffeeData';
import {
  ConfiguratorState,
  CoffeeOriginId,
  CoffeeWeight,
  GrindType,
  BagFinish,
} from './types';
import { CoffeeSceneCanvas, CoffeeSceneCanvasHandle } from './components/CoffeeSceneCanvas';
import { HeaderBar } from './components/HeaderBar';
import { ControlPanel } from './components/ControlPanel';
import { OrderModal } from './components/OrderModal';
import { sound } from './utils/sound';
import { Check, Sparkles, Move3d } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<ConfiguratorState>({
    originId: 'etiopia',
    weight: '250g',
    grind: 'ziarna',
    finish: 'matte',
    autoRotate: true,
    soundEnabled: true,
  });

  const [beanCount, setBeanCount] = useState(0);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<CoffeeSceneCanvasHandle>(null);

  const currentOrigin = COFFEE_ORIGINS[config.originId];

  // Sync sound settings
  useEffect(() => {
    sound.enabled = config.soundEnabled;
  }, [config.soundEnabled]);

  // Show brief toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Handlers
  const handleSelectOrigin = (originId: CoffeeOriginId) => {
    setConfig((prev) => ({ ...prev, originId }));
    showToast(`Wybrano: ${COFFEE_ORIGINS[originId].name}`);
  };

  const handleSelectWeight = (weight: CoffeeWeight) => {
    setConfig((prev) => ({ ...prev, weight }));
  };

  const handleSelectGrind = (grind: GrindType) => {
    setConfig((prev) => ({ ...prev, grind }));
  };

  const handleSelectFinish = (finish: BagFinish) => {
    setConfig((prev) => ({ ...prev, finish }));
  };

  const handleToggleAutoRotate = () => {
    setConfig((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
  };

  const handleToggleSound = () => {
    const nextVal = !config.soundEnabled;
    sound.enabled = nextVal;
    if (nextVal) sound.playClick();
    setConfig((prev) => ({ ...prev, soundEnabled: nextVal }));
  };

  const handleSpawnBeans = () => {
    canvasRef.current?.spawnBeans(45);
  };

  const handleClearBeans = () => {
    canvasRef.current?.clearBeans();
    setBeanCount(0);
    showToast('Posprzątano ziarna ze sceny');
  };

  const handleSelectCameraView = (view: 'front' | 'angled' | 'top' | 'close') => {
    canvasRef.current?.setCameraView(view);
  };

  const handleSnapshot = () => {
    const dataUrl = canvasRef.current?.captureSnapshot();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `Ziarenko-3D-${currentOrigin.name}-${config.weight}.png`;
    link.href = dataUrl;
    link.click();
    showToast('Zapisano zrzut ekranu paczki 📸');
  };

  // Keyboard shortcut helpers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleSpawnBeans();
      } else if (e.code === 'KeyR') {
        handleSelectCameraView('front');
      } else if (e.code === 'KeyA') {
        handleToggleAutoRotate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.autoRotate]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#EAE3D6] font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <CoffeeSceneCanvas
          ref={canvasRef}
          config={config}
          currentOrigin={currentOrigin}
          onBeanCountChange={setBeanCount}
        />
      </div>

      {/* Header Bar (Branding & Global Controls) */}
      <HeaderBar
        autoRotate={config.autoRotate}
        onToggleAutoRotate={handleToggleAutoRotate}
        soundEnabled={config.soundEnabled}
        onToggleSound={handleToggleSound}
        onSelectCameraView={handleSelectCameraView}
        onSnapshot={handleSnapshot}
      />

      {/* Floating 3D Interaction Hint (Discreet bottom-left overlay) */}
      <div className="hidden md:flex absolute bottom-5 left-5 z-10 items-center gap-2 bg-stone-900/60 text-stone-300 text-xs px-3.5 py-2 rounded-2xl border border-stone-800/60 backdrop-blur-sm pointer-events-none">
        <Move3d className="w-4 h-4 text-amber-400" />
        <span>Przeciągnij myszą, aby obrócić paczkę • Rolka: Przybliż • Spacja: Wsyp ziarna</span>
      </div>

      {/* Interactive Polish UI Side Panel / Mobile Bottom Sheet */}
      <ControlPanel
        config={config}
        currentOrigin={currentOrigin}
        beanCount={beanCount}
        onSelectOrigin={handleSelectOrigin}
        onSelectWeight={handleSelectWeight}
        onSelectGrind={handleSelectGrind}
        onSelectFinish={handleSelectFinish}
        onSpawnBeans={handleSpawnBeans}
        onClearBeans={handleClearBeans}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
      />

      {/* Order Summary & Checkout Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        origin={currentOrigin}
        weight={config.weight}
        grind={config.grind}
        finish={config.finish}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-stone-100 text-xs font-medium px-4 py-2.5 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
