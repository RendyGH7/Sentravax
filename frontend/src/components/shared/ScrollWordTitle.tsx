import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollWordTitleProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'p' | 'span';
  className?: string;
  stagger?: number;
  duration?: number;
  startTrigger?: string;
  delay?: number;
  once?: boolean;
}

/**
 * Extracts plain text from React nodes for accessible aria-label
 */
function extractPlainText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractPlainText).join(' ');
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractPlainText(props.children);
  }
  return '';
}

/**
 * Splits strings and nested React elements into animated word tokens
 */
function renderWords(node: React.ReactNode, keyPrefix = 'word-node'): React.ReactNode {
  if (typeof node === 'string' || typeof node === 'number') {
    const text = String(node);
    const tokens = text.split(/(\s+)/);

    return tokens.map((token, i) => {
      if (/^\s+$/.test(token)) {
        return ' ';
      }
      if (!token) return null;

      return (
        <span
          key={`${keyPrefix}-w-${i}`}
          className="inline-block overflow-hidden align-top leading-[inherit] pb-[0.18em] -mb-[0.18em]"
        >
          <span className="gsap-reveal-word inline-block will-change-transform will-change-opacity">
            {token}
          </span>
        </span>
      );
    });
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => renderWords(child, `${keyPrefix}-${i}`));
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<any>;
    const children = element.props.children;
    return React.cloneElement(
      element,
      { key: keyPrefix },
      renderWords(children, `${keyPrefix}-child`)
    );
  }

  return node;
}

/**
 * ScrollWordTitle — GSAP + ScrollTrigger word-by-word reveal component.
 *
 * Words smoothly emerge and slide up into view sequentially when scrolled into the viewport.
 */
export const ScrollWordTitle: React.FC<ScrollWordTitleProps> = ({
  children,
  as: Component = 'h2',
  className = '',
  stagger = 0.045,
  duration = 0.65,
  startTrigger = 'top 88%',
  delay = 0,
  once = false,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const plainText = extractPlainText(children);

  useEffect(() => {
    if (!containerRef.current) return;

    // Respect user's motion preferences
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      const words = containerRef.current?.querySelectorAll('.gsap-reveal-word');
      if (!words || words.length === 0) return;

      gsap.fromTo(
        words,
        {
          y: '105%',
          opacity: 0,
        },
        {
          y: '0%',
          opacity: 1,
          duration,
          delay,
          stagger,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: startTrigger,
            toggleActions: once
              ? 'play none none none'
              : 'play none none reverse',
          },
        }
      );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [stagger, duration, startTrigger, delay, once]);

  return (
    <Component
      ref={containerRef as any}
      aria-label={plainText}
      className={className}
    >
      {renderWords(children)}
    </Component>
  );
};
