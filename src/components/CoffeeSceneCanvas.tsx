import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { CoffeeSceneManager } from '../three/CoffeeSceneManager';
import { ConfiguratorState, CoffeeOrigin } from '../types';

export interface CoffeeSceneCanvasHandle {
  spawnBeans: (count?: number) => void;
  clearBeans: () => void;
  setCameraView: (preset: 'front' | 'angled' | 'top' | 'close') => void;
  captureSnapshot: () => string;
}

interface CoffeeSceneCanvasProps {
  config: ConfiguratorState;
  currentOrigin: CoffeeOrigin;
  onBeanCountChange?: (count: number) => void;
}

export const CoffeeSceneCanvas = forwardRef<CoffeeSceneCanvasHandle, CoffeeSceneCanvasProps>(
  ({ config, currentOrigin, onBeanCountChange }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const managerRef = useRef<CoffeeSceneManager | null>(null);

    // Initialize 3D scene once
    useEffect(() => {
      if (!mountRef.current) return;

      const manager = new CoffeeSceneManager({
        container: mountRef.current,
        initialOrigin: currentOrigin,
        initialWeight: config.weight,
        initialGrind: config.grind,
        initialFinish: config.finish,
        autoRotate: config.autoRotate,
      });

      managerRef.current = manager;

      const interval = setInterval(() => {
        if (managerRef.current && onBeanCountChange) {
          onBeanCountChange(managerRef.current.getBeanCount());
        }
      }, 500);

      return () => {
        clearInterval(interval);
        manager.dispose();
        managerRef.current = null;
      };
    }, []);

    // Sync Origin & Finish
    useEffect(() => {
      managerRef.current?.setOrigin(currentOrigin, config.finish);
    }, [currentOrigin, config.finish]);

    // Sync Weight
    useEffect(() => {
      managerRef.current?.setWeight(config.weight);
    }, [config.weight]);

    // Sync Grind
    useEffect(() => {
      managerRef.current?.setGrind(config.grind);
    }, [config.grind]);

    // Sync Auto-Rotate
    useEffect(() => {
      managerRef.current?.setAutoRotate(config.autoRotate);
    }, [config.autoRotate]);

    // Imperative methods for buttons
    useImperativeHandle(ref, () => ({
      spawnBeans: (count = 45) => {
        managerRef.current?.spawnBeans(count);
        if (onBeanCountChange && managerRef.current) {
          onBeanCountChange(managerRef.current.getBeanCount());
        }
      },
      clearBeans: () => {
        managerRef.current?.clearBeans();
        if (onBeanCountChange) {
          onBeanCountChange(0);
        }
      },
      setCameraView: (preset) => {
        managerRef.current?.setCameraView(preset);
      },
      captureSnapshot: () => {
        return managerRef.current ? managerRef.current.captureSnapshot() : '';
      },
    }));

    return (
      <div
        ref={mountRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing select-none outline-none"
        style={{ touchAction: 'none' }}
      />
    );
  }
);

CoffeeSceneCanvas.displayName = 'CoffeeSceneCanvas';
