"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Tag =
  | "div"
  | "section"
  | "header"
  | "article"
  | "figure"
  | "ol"
  | "ul"
  | "li"
  | "dl"
  | "main"
  | "aside";

const TAGS = {
  div: motion.div,
  section: motion.section,
  header: motion.header,
  article: motion.article,
  figure: motion.figure,
  ol: motion.ol,
  ul: motion.ul,
  li: motion.li,
  dl: motion.dl,
  main: motion.main,
  aside: motion.aside,
} as const;

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: Tag;
  delay?: number;
  amount?: number;
}

export function Reveal({
  children,
  className,
  as = "div",
  delay = 0,
  amount = 0.2,
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as];

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={reduce ? fadeOnly : fadeUp}
      transition={{ delay }}
    >
      {children}
    </Tag>
  );
}

interface RevealStaggerProps {
  children: ReactNode;
  className?: string;
  as?: Tag;
  staggerDelay?: number;
  amount?: number;
}

export function RevealStagger({
  children,
  className,
  as = "div",
  staggerDelay = 0.12,
  amount = 0.15,
}: RevealStaggerProps) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as];

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: reduce ? 0 : staggerDelay },
        },
      }}
    >
      {children}
    </Tag>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  as?: Tag;
  style?: React.CSSProperties;
  lift?: boolean;
}

export function RevealItem({
  children,
  className,
  as = "div",
  style,
  lift = false,
}: RevealItemProps) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as];

  const hoverProps =
    lift && !reduce
      ? {
          whileHover: {
            y: -4,
            transition: { type: "spring" as const, stiffness: 400, damping: 28 },
          },
        }
      : {};

  return (
    <Tag
      className={className}
      style={style}
      variants={reduce ? fadeOnly : fadeUp}
      {...hoverProps}
    >
      {children}
    </Tag>
  );
}
