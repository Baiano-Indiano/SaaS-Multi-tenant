"use client";

import * as React from "react";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { TableBody } from "@/components/ui/table";

gsap.registerPlugin(Flip, useGSAP);

interface AnimatedTableBodyProps extends React.ComponentProps<typeof TableBody> {
  rowKeys: string[];
}

export function AnimatedTableBody({
  rowKeys,
  children,
  ...props
}: AnimatedTableBodyProps) {
  const bodyRef = React.useRef<HTMLTableSectionElement>(null);
  const previousStateRef = React.useRef<Flip.FlipState | null>(null);

  useGSAP(
    () => {
      if (!bodyRef.current) return;
      const rows = Array.from(
        bodyRef.current.querySelectorAll<HTMLElement>("[data-flip-id]")
      );
      if (rows.length === 0) return;

      if (previousStateRef.current) {
        Flip.from(previousStateRef.current, {
          targets: rows,
          duration: 0.36,
          ease: "power2.out",
          stagger: 0.015,
          absolute: false,
        });
      } else {
        gsap.from(rows, {
          autoAlpha: 0,
          y: 12,
          duration: 0.32,
          stagger: 0.04,
          ease: "power2.out",
        });
      }

      previousStateRef.current = Flip.getState(rows);
    },
    {
      scope: bodyRef,
      dependencies: [rowKeys.join("|")],
      revertOnUpdate: false,
    }
  );

  return (
    <TableBody ref={bodyRef} {...props}>
      {children}
    </TableBody>
  );
}

