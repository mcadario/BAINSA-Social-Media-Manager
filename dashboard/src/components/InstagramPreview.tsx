'use client';

import { parseVisualDirection } from '@/lib/parseVisualDirection';
import type { Slide } from '@/lib/types';

interface InstagramPreviewProps {
  slide: Slide;
  /** Optional: index for multi-slide navigation display */
  index?: number;
  total?: number;
}

export default function InstagramPreview({ slide, index, total }: InstagramPreviewProps) {
  const { accentColor, bgColor, textColor } = parseVisualDirection(slide.visual_direction);

  const mutedText = bgColor === '#0a0a0a'
    ? 'rgba(244,243,243,0.45)'
    : 'rgba(10,10,10,0.45)';

  const borderColor = `${accentColor}33`; // 20% opacity

  return (
    <div className="flex flex-col items-center gap-3 animate-slide-up">
      {/* Slide counter */}
      {total && total > 1 && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === (index ?? 0) ? '20px' : '6px',
                backgroundColor: i === (index ?? 0) ? accentColor : 'rgba(244,243,243,0.2)',
              }}
            />
          ))}
        </div>
      )}

      {/* ----------------------------------------------------------------
          9:16 Story Container
      ---------------------------------------------------------------- */}
      <div
        className="relative overflow-hidden rounded-sm flex flex-col"
        style={{
          aspectRatio: '9 / 16',
          width: '100%',
          maxWidth: '280px',
          backgroundColor: bgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* ── Corner elements (brand mark) ── */}
        <CornerBracket position="top-left"  accentColor={accentColor} />
        <CornerBracket position="top-right" accentColor={accentColor} />

        {/* ── Top bar: BAINSA branding ── */}
        <div className="px-5 pt-5 flex items-center justify-between">
          <div className="flex flex-col leading-none">
            <span
              className="font-heading font-semibold tracking-[0.25em] uppercase"
              style={{ color: textColor, fontSize: '10px' }}
            >
              BAINSA
            </span>
            <span
              className="font-body uppercase tracking-[0.2em]"
              style={{ color: mutedText, fontSize: '8px' }}
            >
              AI · Today
            </span>
          </div>
          {/* Slide number pill */}
          <div
            className="rounded-sm px-2 py-0.5 font-mono"
            style={{
              backgroundColor: `${accentColor}22`,
              border: `1px solid ${accentColor}44`,
              color: accentColor,
              fontSize: '9px',
            }}
          >
            {slide.slide_number}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col justify-center px-5 py-4 gap-3 min-h-0">
          {/* Hook */}
          <h1
            className="font-heading font-semibold leading-tight"
            style={{
              color: textColor,
              fontSize: '15px',
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            {slide.hook}
          </h1>

          {/* Divider */}
          <div
            className="h-px w-8"
            style={{ backgroundColor: accentColor }}
          />

          {/* Body */}
          <p
            className="font-body leading-relaxed"
            style={{
              color: textColor,
              fontSize: '9px',
              textAlign: 'justify',
              wordBreak: 'break-word',
              opacity: 0.9,
            }}
          >
            {slide.body}
          </p>
        </div>

        {/* ── Bottom: CTA ── */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <span
            className="font-body font-semibold uppercase tracking-widest"
            style={{ color: accentColor, fontSize: '8px' }}
          >
            {slide.cta}
          </span>
          {/* Arrow icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{ color: accentColor }}
          >
            <path
              d="M2 7H12M8 3L12 7L8 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        </div>

        {/* ── Bottom corner elements ── */}
        <CornerBracket position="bottom-left"  accentColor={accentColor} />
        <CornerBracket position="bottom-right" accentColor={accentColor} />
      </div>

      {/* ── Source label (below the card) ── */}
      <p
        className="font-mono text-[9px] text-center px-2 leading-snug"
        style={{ color: 'rgba(244,243,243,0.35)', maxWidth: '280px' }}
      >
        {slide.source_topic_headline}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corner bracket accent element (brand identity)
// ---------------------------------------------------------------------------

type CornerPos = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

function CornerBracket({
  position,
  accentColor,
}: {
  position: CornerPos;
  accentColor: string;
}) {
  const SIZE = 12;
  const OFFSET = 10;
  const THICK = 1.5;

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  };

  switch (position) {
    case 'top-left':
      positionStyle.top = OFFSET;
      positionStyle.left = OFFSET;
      positionStyle.borderTop = `${THICK}px solid ${accentColor}`;
      positionStyle.borderLeft = `${THICK}px solid ${accentColor}`;
      break;
    case 'top-right':
      positionStyle.top = OFFSET;
      positionStyle.right = OFFSET;
      positionStyle.borderTop = `${THICK}px solid ${accentColor}`;
      positionStyle.borderRight = `${THICK}px solid ${accentColor}`;
      break;
    case 'bottom-left':
      positionStyle.bottom = OFFSET;
      positionStyle.left = OFFSET;
      positionStyle.borderBottom = `${THICK}px solid ${accentColor}`;
      positionStyle.borderLeft = `${THICK}px solid ${accentColor}`;
      break;
    case 'bottom-right':
      positionStyle.bottom = OFFSET;
      positionStyle.right = OFFSET;
      positionStyle.borderBottom = `${THICK}px solid ${accentColor}`;
      positionStyle.borderRight = `${THICK}px solid ${accentColor}`;
      break;
  }

  return <span style={positionStyle} />;
}
