import React, { useState } from 'react';
import {
  COFFEE_ORIGINS,
  WEIGHT_OPTIONS,
  GRIND_OPTIONS,
} from '../constants/coffeeData';
import {
  CoffeeOriginId,
  CoffeeWeight,
  GrindType,
  BagFinish,
  ConfiguratorState,
  CoffeeOrigin,
} from '../types';
import { sound } from '../utils/sound';
import {
  Sparkles,
  ShoppingBag,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flame,
  Scale,
  Sliders,
  Layers,
  Check,
  Package,
} from 'lucide-react';

interface ControlPanelProps {
  config: ConfiguratorState;
  currentOrigin: CoffeeOrigin;
  beanCount: number;
  onSelectOrigin: (id: CoffeeOriginId) => void;
  onSelectWeight: (weight: CoffeeWeight) => void;
  onSelectGrind: (grind: GrindType) => void;
  onSelectFinish: (finish: BagFinish) => void;
  onSpawnBeans: () => void;
  onClearBeans: () => void;
  onOpenOrderModal: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  currentOrigin,
  beanCount,
  onSelectOrigin,
  onSelectWeight,
  onSelectGrind,
  onSelectFinish,
  onSpawnBeans,
  onClearBeans,
  onOpenOrderModal,
}) => {
  // Mobile sheet collapse state
  const [isMobileOpen, setIsMobileOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'kawa' | 'paczka' | 'mielenie'>('kawa');

  const currentPrice = currentOrigin.prices[config.weight];
  const weightGrams = config.weight === '1000g' ? 1000 : parseInt(config.weight, 10);
  const pricePer100g = ((currentPrice / weightGrams) * 100).toFixed(2);

  return (
    <aside
      className={`fixed lg:absolute z-30 transition-all duration-300 ease-in-out
        ${
          /* Mobile styles: bottom sheet */
          'bottom-0 left-0 right-0 max-h-[82vh] lg:max-h-none lg:h-auto'
        }
        ${
          /* Desktop styles: pinned right floating dock / panel */
          'lg:top-4 lg:bottom-4 lg:right-4 lg:left-auto lg:w-[440px]'
        }
        flex flex-col
      `}
    >
      {/* Mobile Drawer Grab / Toggle Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-stone-900/95 text-stone-200 border-t border-stone-800 rounded-t-3xl backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-white/20"
            style={{ backgroundColor: currentOrigin.color }}
          />
          <span className="font-serif font-bold text-sm text-stone-100">
            {currentOrigin.name} • {config.weight}
          </span>
          <span className="text-amber-400 font-bold text-sm ml-1">
            {currentPrice} zł
          </span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsMobileOpen(!isMobileOpen);
          }}
          className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center gap-1 text-xs"
        >
          {isMobileOpen ? (
            <>
              <span>Zwiń 3D</span>
              <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Dostosuj</span>
              <ChevronUp className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Main Panel Content Card */}
      <div
        className={`bg-stone-900/95 text-stone-100 border border-stone-800/90 backdrop-blur-xl shadow-2xl flex flex-col flex-1 overflow-hidden
          ${isMobileOpen ? 'max-h-[72vh] lg:max-h-full' : 'max-h-0 lg:max-h-full border-t-0 lg:border-t'}
          rounded-none lg:rounded-3xl transition-all duration-300
        `}
      >
        {/* Panel Header (Origin highlight & Quick summary) */}
        <div className="p-4 sm:p-5 border-b border-stone-800/80 bg-stone-950/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                  style={{ backgroundColor: currentOrigin.color }}
                />
                <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
                  Palarnia Ziarenko
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                {currentOrigin.name}
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">
                {currentOrigin.region}
              </p>
            </div>

            {/* Price badge */}
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                {currentPrice} <span className="text-sm font-semibold text-stone-400">zł</span>
              </div>
              <div className="text-[11px] text-stone-400">
                {pricePer100g} zł / 100g
              </div>
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-stone-950/70 p-1 rounded-xl mt-4 border border-stone-800/60 text-xs font-medium">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('kawa');
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'kawa'
                  ? 'bg-amber-600 text-white shadow-md font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Pochodzenie</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('paczka');
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'paczka'
                  ? 'bg-amber-600 text-white shadow-md font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Waga & Styl</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('mielenie');
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'mielenie'
                  ? 'bg-amber-600 text-white shadow-md font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Mielenie</span>
            </button>
          </div>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-sm">
          {/* TAB 1: KAWA / ORIGIN */}
          {activeTab === 'kawa' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-stone-400 flex items-center justify-between mb-2.5">
                  <span>Wybierz ziarno speciality (4 kraje)</span>
                  <span className="text-[11px] text-amber-400 lowercase font-normal">
                    zmienia kolor paczki i etykietę
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(COFFEE_ORIGINS) as CoffeeOriginId[]).map((id) => {
                    const item = COFFEE_ORIGINS[id];
                    const isSelected = item.id === config.originId;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          sound.playClick();
                          onSelectOrigin(id);
                        }}
                        className={`p-3 rounded-2xl text-left transition-all border relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-stone-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                            : 'bg-stone-950/40 border-stone-800/80 hover:bg-stone-800/40 hover:border-stone-700'
                        }`}
                      >
                        {/* Top origin indicator */}
                        <div className="flex items-center justify-between w-full mb-2">
                          <span
                            className="w-5 h-5 rounded-full shadow-inner border border-white/20 flex items-center justify-center text-[10px]"
                            style={{ backgroundColor: item.color }}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </span>
                          <span className="text-[10px] font-semibold text-stone-400 uppercase">
                            od {item.prices['250g']} zł
                          </span>
                        </div>

                        <div>
                          <div className="font-serif font-bold text-base text-white">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                            {item.region.split(' ')[0]}
                          </div>
                        </div>

                        {/* Tasting note badge */}
                        <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center gap-1 text-[10px] text-amber-300 font-medium line-clamp-1">
                          <span>{item.tastingNotes[0]}</span>
                          <span>•</span>
                          <span>{item.tastingNotes[1]}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Origin Flavor Profile Details */}
              <div className="bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800/70 space-y-3">
                <div className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                  <span>Profil sensoryczny {currentOrigin.name}</span>
                  <span className="text-[11px] text-stone-400">{currentOrigin.process}</span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed italic">
                  "{currentOrigin.description}"
                </p>

                {/* Flavor Sliders */}
                <div className="space-y-1.5 pt-1">
                  {[
                    { label: 'Kwasowość', value: currentOrigin.flavorProfile.kwasowosc },
                    { label: 'Słodycz', value: currentOrigin.flavorProfile.slodycz },
                    { label: 'Ciało (Body)', value: currentOrigin.flavorProfile.cialo },
                    { label: 'Aromat', value: currentOrigin.flavorProfile.aromat },
                  ].map((attr) => (
                    <div key={attr.label} className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400 w-24">{attr.label}</span>
                      <div className="flex-1 max-w-[170px] h-2 bg-stone-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full ${
                              level <= attr.value ? 'bg-amber-500' : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-stone-300 font-mono w-5 text-right font-medium">
                        {attr.value}/5
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Wysokość: <strong className="text-stone-200">{currentOrigin.altitude}</strong></span>
                  <span>Odmiana: <strong className="text-stone-200">{currentOrigin.varietal}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PACZKA / WEIGHT & FINISH */}
          {activeTab === 'paczka' && (
            <div className="space-y-5">
              {/* Weight Selector */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-stone-400 flex items-center justify-between mb-2.5">
                  <span>Waga opakowania</span>
                  <span className="text-[11px] text-amber-400 font-normal">
                    skaluje paczkę 3D w czasie rzeczywistym
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {WEIGHT_OPTIONS.map((opt) => {
                    const isSelected = opt.id === config.weight;
                    const price = currentOrigin.prices[opt.id];
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          sound.playClick();
                          onSelectWeight(opt.id);
                        }}
                        className={`p-3 rounded-2xl text-center transition-all border flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-amber-600/20 border-amber-500 text-white shadow-md ring-1 ring-amber-500/50'
                            : 'bg-stone-950/40 border-stone-800/80 text-stone-300 hover:bg-stone-800/50 hover:border-stone-700'
                        }`}
                      >
                        <span className="font-bold text-lg">{opt.label}</span>
                        <span className="text-amber-400 font-black text-sm mt-1">
                          {price} zł
                        </span>
                        <span className="text-[10px] text-stone-400 mt-1">
                          {opt.sublabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Finish / Packaging Material */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2.5 block">
                  Wykończenie paczki
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSelectFinish('matte');
                    }}
                    className={`p-3 rounded-2xl text-left border flex items-center gap-3 transition-all ${
                      config.finish === 'matte'
                        ? 'bg-stone-800/90 border-amber-500 ring-1 ring-amber-500/50'
                        : 'bg-stone-950/40 border-stone-800/80 hover:bg-stone-800/40'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl shadow-sm border border-white/20 flex items-center justify-center"
                      style={{ backgroundColor: currentOrigin.color }}
                    >
                      {config.finish === 'matte' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">Satynowy Mat</div>
                      <div className="text-[10px] text-stone-400">Gładka, nowoczesna</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onSelectFinish('kraft');
                    }}
                    className={`p-3 rounded-2xl text-left border flex items-center gap-3 transition-all ${
                      config.finish === 'kraft'
                        ? 'bg-stone-800/90 border-amber-500 ring-1 ring-amber-500/50'
                        : 'bg-stone-950/40 border-stone-800/80 hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#C7A379] shadow-sm border border-stone-700 flex items-center justify-center">
                      {config.finish === 'kraft' && <Check className="w-4 h-4 text-stone-950" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">Eko Kraft Papier</div>
                      <div className="text-[10px] text-stone-400">Rustykalna, naturalna</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MIELENIE / GRIND */}
          {activeTab === 'mielenie' && (
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2.5 block">
                Przeznaczenie i stopień zmielenia
              </label>

              <div className="grid grid-cols-2 gap-2">
                {GRIND_OPTIONS.map((g) => {
                  const isSelected = g.id === config.grind;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        sound.playClick();
                        onSelectGrind(g.id);
                      }}
                      className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500/50'
                          : 'bg-stone-950/40 border-stone-800/80 text-stone-300 hover:bg-stone-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{g.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-stone-400 mt-1 line-clamp-1">
                        {g.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-stone-950/50 p-3 rounded-xl border border-stone-800/60 text-xs text-stone-400 flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">💡</span>
                <span>
                  Mielimy tuż przed zapakowaniem do zgrzewanej paczki z zaworem ochronnym.
                </span>
              </div>
            </div>
          )}

          {/* INTERACTION: "WSYP ZIARNA" (FALLING BEANS PHYSICS) */}
          <div className="pt-2 border-t border-stone-800/80">
            <div className="bg-gradient-to-r from-stone-950 to-stone-900 p-3.5 rounded-2xl border border-stone-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fizyka Ziaren 3D</span>
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  {beanCount > 0 ? (
                    <span className="text-amber-400 font-medium">
                      {beanCount} ziaren na podłodze
                    </span>
                  ) : (
                    'Kliknij, aby wysypać ziarna na scenę'
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {beanCount > 0 && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onClearBeans();
                    }}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-rose-400 transition-colors"
                    title="Wyczyść ziarna z podłogi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    onSpawnBeans();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-600/30 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>☕ Wsyp ziarna</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Sticky Footer / CTA */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Podsumowanie
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white">{currentPrice} zł</span>
              <span className="text-xs text-stone-400">/ {config.weight}</span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenOrderModal();
            }}
            className="flex-1 max-w-[220px] py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Zamawiam paczkę</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
