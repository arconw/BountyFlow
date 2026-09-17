"use client";

import { forwardRef } from "react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import type { Bounty } from "@/types/bounty";
import { motionTiming } from "@/lib/motion";
import { BountyCard } from "@/components/bounty/bounty-card";
import { EmptyState } from "@/components/ui/empty-state";

const AnimatedBountyItem = forwardRef<
  HTMLDivElement,
  { bounty: Bounty; index: number; reduced: boolean }
>(function AnimatedBountyItem({ bounty, index, reduced }, ref) {
  const present = useIsPresent();
  return (
    <motion.div
      ref={ref}
      className="bounty-grid-item"
      layout={reduced ? false : "position"}
      inert={!present}
      aria-hidden={!present || undefined}
      initial={{ opacity: 0, y: reduced ? 0 : motionTiming.enterOffset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        y: reduced ? 0 : -8,
        transition: reduced ? { duration: 0 } : motionTiming.exit,
      }}
      transition={
        reduced
          ? { duration: 0 }
          : {
              ...motionTiming.enter,
              delay: Math.min(
                index * motionTiming.stagger,
                motionTiming.maxStagger,
              ),
              layout: motionTiming.layout,
            }
      }
    >
      <BountyCard bounty={bounty} />
    </motion.div>
  );
});

export function AnimatedBountyGrid({
  bounties,
  view,
  onReset,
}: {
  bounties: Bounty[];
  view: "grid" | "list";
  onReset: () => void;
}) {
  const reduced = !!useReducedMotion();
  return (
    <div className={`bounty-grid ${view === "list" ? "bounty-list" : ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {bounties.length ? (
          bounties.map((bounty, index) => (
            <AnimatedBountyItem
              key={bounty.id}
              bounty={bounty}
              index={index}
              reduced={reduced}
            />
          ))
        ) : (
          <motion.div
            key="empty"
            className="bounty-grid-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : motionTiming.exit.duration }}
          >
            <EmptyState onReset={onReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
