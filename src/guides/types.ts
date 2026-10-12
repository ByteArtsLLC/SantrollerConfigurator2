import React from 'react';
import { ConfigState } from '@/components/SettingsContext/SettingsContext';

export interface RecommendedPin {
  pin: number;
  physicalPin?: number;
  label: string;
  type: 'digital' | 'analog' | 'i2c' | 'power' | 'ground';
  color?: string;
}

export interface GuideStepProps {
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

export interface GuideStep {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  badge?: string;
  recommendedPins?: RecommendedPin[];
  render: React.ComponentType<GuideStepProps>;
  isVerified?: (state: ConfigState) => boolean;
}

export type GuideCategory = 'guitar' | 'drums' | 'adapters' | 'turntable' | 'mods';

export interface GuideDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: GuideCategory;
  estimatedTime: string;
  badge?: string;
  featured?: boolean;
  supplies?: string[];
  steps: GuideStep[];
}
