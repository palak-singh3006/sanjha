"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ClusterMap = dynamic(
  () => import("@/components/map/cluster-map").then((m) => ({ default: m.ClusterMap })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full rounded-2xl" />,
  },
);

export function ClusterMapLazy() {
  return <ClusterMap />;
}
