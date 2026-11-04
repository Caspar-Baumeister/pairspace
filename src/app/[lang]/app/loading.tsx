import { FullScreenSpinner } from "@/components/ui/Spinner";

// Not at the [lang] root: a loading boundary there would send unknown paths
// as 200 before the catch all page can answer 404.
export default function Loading() {
  return <FullScreenSpinner />;
}
