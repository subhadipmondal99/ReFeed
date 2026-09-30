import {
  Brain,
  Package,
  Utensils,
  HeartHandshake,
  BarChart3,
  Check,
} from "lucide-react";

const steps = [
  {
    id: "forecast",
    label: "Forecast",
    icon: Brain,
  },
  {
    id: "prepare",
    label: "Prepare",
    icon: Package,
  },
  {
    id: "serve",
    label: "Serve",
    icon: Utensils,
  },
  {
    id: "rescue",
    label: "Rescue",
    icon: HeartHandshake,
  },
  {
    id: "impact",
    label: "Impact",
    icon: BarChart3,
  },
];

export default function WorkflowStepper({
  currentStep = "forecast",
}) {
  const currentIndex = steps.findIndex(
    (step) => step.id === currentStep
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Food Rescue Workflow
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Track today's food management process.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;

          const completed =
            index < currentIndex;

          const active =
            index === currentIndex;

          return (
            <div
              key={step.id}
              className="flex flex-1 items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                    completed
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : active
                      ? "border-emerald-600 bg-emerald-50 text-emerald-600"
                      : "border-gray-200 bg-gray-50 text-gray-400",
                  ].join(" ")}
                >
                  {completed ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <p
                    className={[
                      "text-sm font-semibold",
                      active || completed
                        ? "text-gray-900"
                        : "text-gray-400",
                    ].join(" ")}
                  >
                    {step.label}
                  </p>

                  <p className="text-xs text-gray-400">
                    {completed
                      ? "Completed"
                      : active
                      ? "In progress"
                      : "Pending"}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={[
                    "mx-4 hidden h-0.5 flex-1 md:block",
                    index < currentIndex
                      ? "bg-emerald-600"
                      : "bg-gray-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}