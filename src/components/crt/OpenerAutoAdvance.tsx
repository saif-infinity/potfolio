"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const OPENER_AUTO_ADVANCE_DELAY_MS = 6000;

export function OpenerAutoAdvance() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/home");

    let timer: ReturnType<typeof setTimeout> | undefined = undefined;
    let done = false;

    function teardown(): void {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    }

    function fire(): void {
      if (done) return;
      done = true;
      teardown();
      router.replace("/home");
    }

    timer = setTimeout(fire, OPENER_AUTO_ADVANCE_DELAY_MS);

    return teardown;
  }, [router]);

  return null;
}
