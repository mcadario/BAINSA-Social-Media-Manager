'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { OutputFile, StoryOutput } from '@/lib/types';
import InstagramPreview from './InstagramPreview';

interface OutputGalleryProps {
  /** If set, auto-loads this file when the component mounts / value changes */
  highlightFile?: string | null;
}

export default function OutputGallery({ highlightFile }: OutputGalleryProps) {
  const [files, setFiles] = useState<OutputFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [output, setOutput] = useState<StoryOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedSlides, setEditedSlides] = useState<StoryOutput['slides']>([]);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch('/api/outputs');
      const data = await res.json();
      setFiles(data.files ?? []);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const loadOutput = useCallback(async (filename: string) => {
    setLoading(true);
    setOutput(null);
    setActiveSlide(0);
    setEditMode(false);
    try {
      const res = await fetch(`/api/output/${encodeURIComponent(filename)}`);
      const data = await res.json();
      if (data.data) {
        setOutput(data.data);
        setEditedSlides(JSON.parse(JSON.stringify(data.data.slides)));
        setSelectedFile(filename);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // Auto-highlight new output when agent finishes
  useEffect(() => {
    if (highlightFile) {
      fetchFiles();
      loadOutput(highlightFile);
    }
  }, [highlightFile, fetchFiles, loadOutput]);

  const slides = editMode ? editedSlides : (output?.slides ?? []);
  const currentSlide = slides[activeSlide];

  // ── Download current slide as PNG ──────────────────────────────────────────
  async function downloadSlide(slideIndex: number) {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 4, // ~1120px wide — close to Instagram's 1080px native
        cacheBust: true,
      });
      const link = document.createElement('a');
      // Build a clean filename: bainsa_slide_1_20260418_135721.png
      const datePart = selectedFile
        ?.replace('agent_b_story_output_', '')
        .replace('.json', '') ?? 'export';
      link.download = `bainsa_slide_${slideIndex + 1}_${datePart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  async function downloadAllSlides() {
    for (let i = 0; i < slides.length; i++) {
      setActiveSlide(i);
      // Give React one frame to re-render the card before capturing
      await new Promise((r) => setTimeout(r, 120));
      await downloadSlide(i);
    }
  }

  return (
    <section className="flex flex-col gap-5 h-full min-h-0">

      {/* Section title */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 border-l-2 border-t-2"
            style={{ borderColor: '#fe43a7' }}
          />
          <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-bainsa-muted">
            Story Preview
          </h2>
        </div>
        <button
          onClick={fetchFiles}
          disabled={loadingFiles}
          className="rounded-sm border border-bainsa-border px-2 py-1 font-mono text-[9px]
                     uppercase tracking-widest text-bainsa-muted hover:text-bainsa-white
                     hover:border-bainsa-white/30 transition-colors disabled:opacity-40"
        >
          {loadingFiles ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">

        {/* ── Left: file list ── */}
        <div
          className="lg:w-56 flex-shrink-0 rounded-sm border border-bainsa-border
                     bg-bainsa-surface overflow-y-auto"
          style={{ maxHeight: '480px' }}
        >
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 gap-2 text-center">
              <p className="font-mono text-xs text-bainsa-muted">No outputs yet.</p>
              <p className="font-body text-[10px] text-bainsa-muted/60">
                Run Agent B to generate stories.
              </p>
            </div>
          ) : (
            <ul>
              {files.map((f) => (
                <li key={f.filename}>
                  <button
                    onClick={() => loadOutput(f.filename)}
                    className={`
                      w-full text-left px-3 py-3 border-b border-bainsa-border
                      transition-colors duration-100
                      ${selectedFile === f.filename
                        ? 'bg-bainsa-blue/10 border-l-2 border-l-bainsa-blue'
                        : 'hover:bg-bainsa-white/5'
                      }
                    `}
                  >
                    <p className="font-mono text-[10px] text-bainsa-white truncate">
                      {f.dateLabel}
                    </p>
                    <p className="font-mono text-[9px] text-bainsa-muted mt-0.5">
                      {f.slideCount} slide{f.slideCount !== 1 ? 's' : ''}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Right: preview + editor ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          )}

          {!loading && !output && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
              <div className="relative h-12 w-12">
                <span className="absolute top-0 left-0 h-4 w-4 border-l-2 border-t-2"
                      style={{ borderColor: '#2740eb' }} />
                <span className="absolute bottom-0 right-0 h-4 w-4 border-r-2 border-b-2"
                      style={{ borderColor: '#fe6203' }} />
              </div>
              <p className="font-mono text-xs text-bainsa-muted">Select a run to preview slides</p>
            </div>
          )}

          {!loading && output && currentSlide && (
            <>
              {/* Slide navigation + download controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Slide tabs */}
                {slides.length > 1 && slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`
                      flex-1 rounded-sm border py-1.5 font-mono text-[10px] uppercase
                      tracking-widest transition-colors
                      ${activeSlide === i
                        ? 'border-bainsa-blue bg-bainsa-blue/10 text-bainsa-blue'
                        : 'border-bainsa-border text-bainsa-muted hover:text-bainsa-white'
                      }
                    `}
                  >
                    Slide {i + 1}
                  </button>
                ))}

                {/* Download active slide */}
                <button
                  onClick={() => downloadSlide(activeSlide)}
                  disabled={downloading}
                  title="Download this slide as PNG"
                  className="rounded-sm border border-bainsa-border px-2.5 py-1.5 font-mono
                             text-[10px] uppercase tracking-widest text-bainsa-muted
                             hover:text-bainsa-white hover:border-bainsa-white/30
                             transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  {downloading ? '…' : '↓ PNG'}
                </button>

                {/* Download all slides (only shown when multiple) */}
                {slides.length > 1 && (
                  <button
                    onClick={downloadAllSlides}
                    disabled={downloading}
                    title="Download all slides as PNG"
                    className="rounded-sm border border-bainsa-border px-2.5 py-1.5 font-mono
                               text-[10px] uppercase tracking-widest text-bainsa-muted
                               hover:text-bainsa-white hover:border-bainsa-white/30
                               transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {downloading ? '…' : '↓ All'}
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
                {/* Instagram preview */}
                <div className="flex justify-center lg:justify-start">
                  <InstagramPreview
                    ref={cardRef}
                    slide={currentSlide}
                    index={activeSlide}
                    total={slides.length}
                  />
                </div>

                {/* Slide editor */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-bainsa-muted">
                      Edit Content
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="font-mono text-[9px] text-bainsa-muted uppercase">
                        {editMode ? 'Editing' : 'View Only'}
                      </span>
                      <button
                        onClick={() => {
                          if (editMode) {
                            // Reset on disable
                            setEditedSlides(JSON.parse(JSON.stringify(output.slides)));
                          }
                          setEditMode(!editMode);
                        }}
                        className={`
                          relative inline-flex h-4 w-7 items-center rounded-full
                          transition-colors
                          ${editMode ? 'bg-bainsa-orange' : 'bg-bainsa-white/20'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-3 w-3 rounded-full bg-bainsa-white transition-transform
                            ${editMode ? 'translate-x-3.5' : 'translate-x-0.5'}
                          `}
                        />
                      </button>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 overflow-y-auto">
                    <EditField
                      label="Hook"
                      value={editMode ? editedSlides[activeSlide]?.hook : currentSlide.hook}
                      readOnly={!editMode}
                      onEdit={(v) => updateSlideField(editedSlides, setEditedSlides, activeSlide, 'hook', v)}
                    />
                    <EditField
                      label="Body"
                      multiline
                      value={editMode ? editedSlides[activeSlide]?.body : currentSlide.body}
                      readOnly={!editMode}
                      onEdit={(v) => updateSlideField(editedSlides, setEditedSlides, activeSlide, 'body', v)}
                    />
                    <EditField
                      label="CTA"
                      value={editMode ? editedSlides[activeSlide]?.cta : currentSlide.cta}
                      readOnly={!editMode}
                      onEdit={(v) => updateSlideField(editedSlides, setEditedSlides, activeSlide, 'cta', v)}
                    />
                    <EditField
                      label="Visual Direction"
                      value={currentSlide.visual_direction}
                      readOnly
                    />
                  </div>

                  {/* Brand compliance badge */}
                  <BrandComplianceBadge slide={currentSlide} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function updateSlideField(
  slides: StoryOutput['slides'],
  setSlides: React.Dispatch<React.SetStateAction<StoryOutput['slides']>>,
  index: number,
  field: keyof StoryOutput['slides'][number],
  value: string,
) {
  setSlides((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [field]: value };
    return next;
  });
}

function EditField({
  label,
  value = '',
  multiline = false,
  readOnly = false,
  onEdit,
}: {
  label: string;
  value?: string;
  multiline?: boolean;
  readOnly?: boolean;
  onEdit?: (v: string) => void;
}) {
  const base = `
    w-full rounded-sm border font-body text-xs leading-relaxed
    bg-bainsa-black text-bainsa-white
    px-3 py-2 transition-colors resize-none
    ${readOnly
      ? 'border-bainsa-border text-bainsa-muted cursor-default'
      : 'border-bainsa-blue/40 focus:border-bainsa-blue focus:outline-none'
    }
  `;

  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] uppercase tracking-widest text-bainsa-muted">
        {label}
      </label>
      {multiline ? (
        <textarea
          className={base}
          rows={4}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onEdit?.(e.target.value)}
        />
      ) : (
        <input
          className={base}
          type="text"
          value={value}
          readOnly={readOnly}
          onChange={(e) => onEdit?.(e.target.value)}
        />
      )}
    </div>
  );
}

function BrandComplianceBadge({ slide }: { slide: { visual_direction: string; cta: string } }) {
  const ctaWords = slide.cta.trim().split(/\s+/).length;
  const checks = [
    {
      label: 'CTA is concise (≤ 8 words)',
      pass: slide.cta.trim().length > 0 && ctaWords <= 8,
    },
    {
      label: 'Uses brand accent colour',
      // Match either hex codes or colour name keywords that the model uses
      pass: /(\#(2740eb|fe6203|fe43a7)|\bblue\b|\borange\b|\bpink\b)/i.test(slide.visual_direction),
    },
    {
      label: 'Minimalistic layout',
      pass: /minimalistic/i.test(slide.visual_direction),
    },
  ];

  const allPass = checks.every((c) => c.pass);

  return (
    <div
      className="rounded-sm border p-3 space-y-2"
      style={{
        borderColor: allPass ? 'rgba(74,222,128,0.3)' : 'rgba(251,146,60,0.3)',
        backgroundColor: allPass ? 'rgba(74,222,128,0.05)' : 'rgba(251,146,60,0.05)',
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest"
         style={{ color: allPass ? '#4ade80' : '#fb923c' }}>
        {allPass ? '✓ Brand Compliant' : '⚠ Compliance Warnings'}
      </p>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2">
            <span className={c.pass ? 'text-green-400' : 'text-orange-400'} style={{ fontSize: '10px' }}>
              {c.pass ? '✓' : '✗'}
            </span>
            <span className="font-body text-[10px]"
                  style={{ color: c.pass ? 'rgba(244,243,243,0.6)' : 'rgba(251,146,60,0.8)' }}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-4 w-4 rounded-full border-2 border-bainsa-blue/30 border-t-bainsa-blue animate-spin"
      />
      <span className="font-mono text-xs text-bainsa-muted">Loading output…</span>
    </div>
  );
}
