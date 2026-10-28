export type CoffeeOriginId = 'etiopia' | 'brazylia' | 'kolumbia' | 'gwatemala';
export type CoffeeWeight = '250g' | '500g' | '1000g';
export type GrindType = 'ziarna' | 'espresso' | 'drip' | 'kawiarka' | 'aeropress' | 'frenchpress';
export type BagFinish = 'matte' | 'kraft';

export interface CoffeeOrigin {
  id: CoffeeOriginId;
  name: string;
  region: string;
  country: string;
  color: string;
  accentColor: string;
  labelBg: string;
  textColor: string;
  tastingNotes: string[];
  varietal: string;
  altitude: string;
  process: string;
  roastLevel: 'Jasny' | 'Średni' | 'Średnio-jasny' | 'Ciemny';
  roastScore: number; // 1-5
  flavorProfile: {
    kwasowosc: number; // 1-5
    slodycz: number;   // 1-5
    cialo: number;     // 1-5
    aromat: number;    // 1-5
  };
  prices: Record<CoffeeWeight, number>;
  description: string;
  bestFor: string;
}

export interface ConfiguratorState {
  originId: CoffeeOriginId;
  weight: CoffeeWeight;
  grind: GrindType;
  finish: BagFinish;
  autoRotate: boolean;
  soundEnabled: boolean;
}
