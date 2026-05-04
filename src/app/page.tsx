import { Suspense } from "react";
import { PageClient } from "@/components/PageClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageClient />
    </Suspense>
  );
}
