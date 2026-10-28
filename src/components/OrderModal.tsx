import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CoffeeOrigin, CoffeeWeight, GrindType, BagFinish } from '../types';
import { GRIND_OPTIONS } from '../constants/coffeeData';
import { sound } from '../utils/sound';
import { X, Check, Truck, ShieldCheck, Heart, Sparkles, ArrowRight } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: CoffeeOrigin;
  weight: CoffeeWeight;
  grind: GrindType;
  finish: BagFinish;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  origin,
  weight,
  grind,
  finish,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isOrdered, setIsOrdered] = useState(false);

  if (!isOpen) return null;

  const basePrice = origin.prices[weight];
  const totalPrice = basePrice * quantity;
  const grindObj = GRIND_OPTIONS.find((g) => g.id === grind);

  const handlePlaceOrder = () => {
    sound.playPourChime();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D46B4E', '#E6A35C', '#463124', '#2A5C43'],
    });
    setIsOrdered(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-stone-100 flex flex-col">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-stone-800/80 bg-stone-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: origin.color }}
            />
            <h2 className="font-serif font-bold text-xl text-white">
              {isOrdered ? 'Dziękujemy za zamówienie!' : 'Twoja spersonalizowana paczka'}
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {isOrdered ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">
                Paczka trafiła do palarni!
              </h3>
              <p className="text-sm text-stone-300 max-w-sm mx-auto leading-relaxed">
                Zamówienie na kawę <strong>{origin.name}</strong> ({weight}, {grindObj?.label}) zostało przyjęte.
                Wypalimy ziarna w najbliższej partii i wyślemy świeże prosto do Twoich drzwi.
              </p>

              <div className="bg-stone-950/50 p-4 rounded-2xl border border-stone-800/80 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between text-stone-400">
                  <span>Czas wysyłki:</span>
                  <span className="text-stone-200 font-semibold">24-48h</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Świeżość gwarantowana:</span>
                  <span className="text-stone-200 font-semibold">Zawór aero + data wypału</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Łączna kwota:</span>
                  <span className="text-amber-400 font-bold text-sm">{totalPrice} zł</span>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  setIsOrdered(false);
                  onClose();
                }}
                className="mt-4 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide shadow-lg transition-all"
              >
                Wróć do konfiguratora 3D
              </button>
            </div>
          ) : (
            <>
              {/* Package Summary Box */}
              <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 flex items-center gap-4">
                <div
                  className="w-16 h-20 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/10 shrink-0 font-serif font-black text-white/90"
                  style={{ backgroundColor: origin.color }}
                >
                  ☕
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                    {origin.country}
                  </div>
                  <div className="font-serif font-bold text-lg text-white truncate">
                    {origin.name} • {weight}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5 truncate">
                    {grindObj?.label} • {finish === 'kraft' ? 'Eko Kraft papier' : 'Satynowy mat'}
                  </div>
                  <div className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                    <span>Nuty:</span>
                    <span className="text-stone-300 font-medium truncate">
                      {origin.tastingNotes.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between bg-stone-950/40 p-3.5 rounded-2xl border border-stone-800">
                <span className="text-sm font-semibold text-stone-300">Liczba paczek:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      sound.playClick();
                      if (quantity > 1) setQuantity(quantity - 1);
                    }}
                    className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="font-bold text-base w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setQuantity(quantity + 1);
                    }}
                    className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Artisan Perks */}
              <div className="grid grid-cols-2 gap-2 text-xs text-stone-400">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-950/30 border border-stone-800/60">
                  <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Darmowa dostawa od 150 zł</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-950/30 border border-stone-800/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Świeżość z rzemieślniczego pieca</span>
                </div>
              </div>

              {/* Total & Confirm Button */}
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-stone-400 uppercase font-semibold">
                    Do zapłaty:
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {totalPrice} <span className="text-sm font-semibold text-stone-300">zł</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Kupuję i zamawiam</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
