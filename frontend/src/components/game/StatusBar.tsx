"use client";

import { useEffect, useState } from "react";
import type { Resources } from "@/lib/types";

interface ResourceBarProps {
  label: string;
  icon: string;
  value: number;
  maxValue: number;
  color: string;
  previousValue?: number;
}

function ResourceBar({
  label,
  icon,
  value,
  maxValue,
  color,
  previousValue,
}: ResourceBarProps) {
  const [flash, setFlash] = useState<"increase" | "decrease" | null>(null);
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    if (previousValue === undefined) return;

    if (value > previousValue) {
      setFlash("increase");
    } else if (value < previousValue) {
      setFlash("decrease");
    }

    const timer = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(timer);
  }, [value, previousValue]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg" role="img" aria-label={label}>
        {icon}
      </span>
      <span className="hidden sm:inline text-xs text-gray-400 w-12">
        {label}
      </span>
      <div
        className={`
          relative h-2 w-16 sm:w-24 bg-gray-700 rounded-full overflow-hidden
          ${flash === "increase" ? "ring-2 ring-green-400" : ""}
          ${flash === "decrease" ? "ring-2 ring-red-400" : ""}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={maxValue}
        aria-label={`${label}: ${value}/${maxValue}`}
      >
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-300 w-4">{value}</span>
    </div>
  );
}

interface StatusBarProps {
  resources: Resources;
  previousResources?: Resources | null;
}

export function StatusBar({ resources, previousResources }: StatusBarProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 p-3 bg-surface-secondary/80 backdrop-blur rounded-lg border border-gray-700">
      <ResourceBar
        label="신뢰도"
        icon="🎭"
        value={resources.trust}
        maxValue={5}
        color="bg-orange-500"
        previousValue={previousResources?.trust}
      />
      <ResourceBar
        label="자산"
        icon="💰"
        value={resources.money}
        maxValue={5}
        color="bg-yellow-500"
        previousValue={previousResources?.money}
      />
      <ResourceBar
        label="경각심"
        icon="👁️"
        value={resources.awareness}
        maxValue={5}
        color="bg-cyan-500"
        previousValue={previousResources?.awareness}
      />
    </div>
  );
}
