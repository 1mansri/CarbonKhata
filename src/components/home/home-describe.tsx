"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DescribeBox } from "@/components/import/describe-box";

/** The hero's describe box: typed or spoken, then drafted on /import. */
export function HomeDescribe() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <DescribeBox
      label="Describe what you're building"
      placeholder="e.g. 230 mm brick wall, 10 m²"
      value={text}
      onChange={setText}
      busy={busy}
      onSubmit={(t) => {
        setBusy(true);
        router.push(`/import?describe=${encodeURIComponent(t.trim())}`);
      }}
    />
  );
}
