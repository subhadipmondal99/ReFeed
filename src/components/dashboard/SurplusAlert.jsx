import {
  AlertTriangle,
  CheckCircle2,
  HeartHandshake,
  MapPin,
} from "lucide-react";

export default function SurplusAlert({
  prepared,
  served,
  remaining,
  ngos = [],
}) {
  const threshold = 20;
  const hasSurplus = remaining > threshold;

  return (
    <div
      className={[
        "rounded-2xl border p-6 shadow-sm",
        hasSurplus
          ? "border-orange-200 bg-orange-50"
          : "border-emerald-200 bg-emerald-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            hasSurplus
              ? "bg-orange-100"
              : "bg-emerald-100",
          ].join(" ")}
        >
          {hasSurplus ? (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {hasSurplus
              ? "Surplus Food Detected"
              : "No Critical Surplus"}
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            {hasSurplus
              ? `${remaining} meals are remaining and can be redirected for food rescue.`
              : `Remaining meals are below the ${threshold}-meal rescue threshold.`}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-xs text-gray-500">
            Prepared
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {prepared}
          </p>
        </div>

        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-xs text-gray-500">
            Served
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {served}
          </p>
        </div>

        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-xs text-gray-500">
            Remaining
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {remaining}
          </p>
        </div>
      </div>

      {hasSurplus && (
        <div className="mt-5 rounded-xl border border-orange-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-orange-600" />

            <p className="font-semibold text-gray-900">
              NGO Dispatch
            </p>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Nearby registered NGOs available for pickup.
          </p>

          {ngos.length > 0 ? (
            <div className="mt-4 space-y-2">
              {ngos.slice(0, 3).map((ngo) => (
                <div
                  key={ngo.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {ngo.name}
                    </p>

                    {ngo.phone && (
                      <p className="text-xs text-gray-500">
                        {ngo.phone}
                      </p>
                    )}
                  </div>

                  {ngo.distanceKm !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />

                      {ngo.distanceKm} km
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
              No nearby NGOs found yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}