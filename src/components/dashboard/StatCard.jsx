import {
  TrendingUp,
  Utensils,
  AlertTriangle,
  HeartHandshake,
} from "lucide-react";

const iconMap = {
  forecast: TrendingUp,
  meals: Utensils,
  surplus: AlertTriangle,
  impact: HeartHandshake,
};

export default function StatCard({
  title,
  value,
  subtitle,
  type = "forecast",
}) {
  const Icon = iconMap[type] || TrendingUp;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
      </div>
    </div>
  );
}