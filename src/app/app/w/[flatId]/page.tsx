"use client";

import { GraphView } from "@/components/graph/GraphView";

import { useCurrentFlat } from "./FlatProvider";

export default function ApplicantsPage() {
  const flat = useCurrentFlat();
  return <GraphView flat={flat} />;
}
