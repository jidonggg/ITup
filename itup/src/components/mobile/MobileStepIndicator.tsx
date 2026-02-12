"use client";

interface Step {
  number: number;
  label: string;
}

interface MobileStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  /** Sticky at top */
  sticky?: boolean;
}

export default function MobileStepIndicator({
  steps,
  currentStep,
  sticky = true,
}: MobileStepIndicatorProps) {
  const progress = steps.length > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 100;

  return (
    <div
      className={`
        bg-card-bg/95 backdrop-blur-md border-b border-card-border
        ${sticky ? "sticky top-16 z-30" : ""}
      `}
    >
      <div className="px-4 py-3">
        {/* Current step label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {steps[currentStep - 1]?.label}
          </span>
          <span className="text-xs text-muted">
            {currentStep} / {steps.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step dots (hidden on very small screens) */}
        <div className="hidden xs:flex items-center justify-between mt-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`
                flex items-center justify-center
                transition-all duration-300
                ${step.number === currentStep
                  ? "scale-110"
                  : step.number < currentStep
                    ? "opacity-100"
                    : "opacity-40"
                }
              `}
            >
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                  ${step.number < currentStep
                    ? "bg-primary text-white"
                    : step.number === currentStep
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md"
                      : "bg-secondary text-muted"
                  }
                `}
              >
                {step.number < currentStep ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
