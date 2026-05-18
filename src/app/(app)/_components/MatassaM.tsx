// Decorativa: la "m" del marchio in Glassure che, al passaggio del cursore,
// ruota su se stessa mentre alcuni filamenti SVG si avvolgono come una matassa.
// Pure CSS, nessun JS — funziona su hover (desktop) e :active (touch).
export function MatassaM() {
  return (
    <div className="relative group shrink-0 select-none w-28 h-28 sm:w-40 sm:h-40 flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full text-amber-700 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-700 pointer-events-none"
        aria-hidden
      >
        <ellipse
          cx="50"
          cy="50"
          rx="44"
          ry="34"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          className="origin-center transition-transform duration-[1600ms] ease-in-out group-hover:rotate-[180deg] group-active:rotate-[180deg]"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.55"
          opacity="0.7"
          className="origin-center rotate-12 transition-transform duration-[1800ms] ease-in-out group-hover:-rotate-[140deg] group-active:-rotate-[140deg]"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="46"
          ry="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.55"
          className="origin-center -rotate-12 transition-transform duration-[2000ms] ease-in-out group-hover:rotate-[270deg] group-active:rotate-[270deg]"
        />
      </svg>

      <span
        className="font-glassure text-[7rem] sm:text-[9rem] leading-none text-neutral-900 group-hover:text-amber-700 group-active:text-amber-700 transition-all duration-[1600ms] ease-in-out group-hover:rotate-[720deg] group-active:rotate-[720deg] inline-block origin-center"
        aria-hidden
      >
        m
      </span>
    </div>
  );
}
