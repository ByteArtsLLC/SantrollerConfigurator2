import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GuideDefinition, GuideStepProps } from './types';

function readStoredStep(guide: GuideDefinition): number {
  try {
    const saved = localStorage.getItem(`santroller_guide_step_${guide.id}`);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < guide.steps.length) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return 0;
}

/**
 * Tracks which step of a guide is open. The step lives in the URL (?step=<id>) so links can
 * point straight at one, and in localStorage so a guide reopens where it was left.
 */
export function useGuideSteps(guide: GuideDefinition, onFinish: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storedStep, setStoredStep] = useState(() => readStoredStep(guide));

  // Reset or load step when the guide changes
  useEffect(() => {
    setStoredStep(readStoredStep(guide));
  }, [guide.id, guide.steps.length]);

  const stepParam = searchParams.get('step');
  const paramStep = guide.steps.findIndex((step) => step.id === stepParam);
  const activeStep = paramStep >= 0 ? paramStep : storedStep;

  const setStep = (nextStep: number) => {
    const clamped = Math.max(0, Math.min(guide.steps.length - 1, nextStep));
    setStoredStep(clamped);
    try {
      localStorage.setItem(`santroller_guide_step_${guide.id}`, String(clamped));
    } catch {
      // Ignore storage errors
    }
    setSearchParams({ step: guide.steps[clamped].id }, { replace: true });
  };

  // Put the step in the URL when the guide was opened without one
  useEffect(() => {
    if (paramStep < 0) {
      setSearchParams({ step: guide.steps[activeStep].id }, { replace: true });
    }
  }, [paramStep, activeStep, guide.id]);

  const isLastStep = activeStep === guide.steps.length - 1;
  const currentStep = guide.steps[activeStep] ?? guide.steps[0];

  const stepProps: GuideStepProps = {
    isFirstStep: activeStep === 0,
    isLastStep,
    onNext: isLastStep ? onFinish : () => setStep(activeStep + 1),
    onPrevious: () => setStep(activeStep - 1),
  };

  return { activeStep, currentStep, setStep, stepProps };
}
