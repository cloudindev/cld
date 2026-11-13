'use client';
// «¿Cómo lo hago?»: en el original hace scroll suave (1000 ms) hasta justo debajo del slider.
export function HeroButton({ className, label }: { className?: string; label: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={e => {
        const hero = (e.currentTarget.closest('[data-hero]') as HTMLElement | null) ?? e.currentTarget.parentElement?.parentElement;
        if (!hero) return;
        const y = hero.getBoundingClientRect().bottom + window.scrollY;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }}
    >
      {label}
    </button>
  );
}
