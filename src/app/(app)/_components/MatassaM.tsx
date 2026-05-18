// Decorativa: la "m" del marchio in Glassure.
// Al passaggio del cursore (e al tap su touch) si scompone in più filamenti
// del proprio profilo che ruotano a velocità e angoli diversi, dando
// l'effetto di una matassa che si avvolge e si srotola. Pure CSS.
// L'elemento è dimensionato esattamente come la m, così baseline e bottom
// combaciano con qualsiasi cosa gli stia accanto.

const OUTLINE_BASE: React.CSSProperties = {
  color: "transparent",
  WebkitTextStrokeColor: "#b45309", // amber-700
};

const STRAND_BASE =
  "absolute top-0 left-0 transition-all ease-in-out origin-center pointer-events-none";

export function MatassaM() {
  return (
    <span
      className="relative inline-block leading-none font-glassure text-[7rem] sm:text-[9rem] select-none group cursor-default"
      aria-hidden
    >
      {/* m piena (base) */}
      <span className="block text-neutral-900 group-hover:text-amber-700 group-active:text-amber-700 transition-all duration-[2000ms] ease-in-out origin-center group-hover:rotate-[720deg] group-active:rotate-[720deg]">
        m
      </span>

      {/* filamenti outlined sovrapposti */}
      <span
        className={`${STRAND_BASE} duration-[2000ms] opacity-0 group-hover:opacity-90 group-active:opacity-90 group-hover:rotate-[540deg] group-active:rotate-[540deg]`}
        style={{ ...OUTLINE_BASE, WebkitTextStrokeWidth: "1px" }}
      >
        m
      </span>
      <span
        className={`${STRAND_BASE} duration-[2300ms] opacity-0 group-hover:opacity-70 group-active:opacity-70 group-hover:-rotate-[360deg] group-active:-rotate-[360deg]`}
        style={{ ...OUTLINE_BASE, WebkitTextStrokeWidth: "0.8px" }}
      >
        m
      </span>
      <span
        className={`${STRAND_BASE} duration-[2600ms] opacity-0 group-hover:opacity-55 group-active:opacity-55 group-hover:rotate-[900deg] group-active:rotate-[900deg]`}
        style={{ ...OUTLINE_BASE, WebkitTextStrokeWidth: "0.7px" }}
      >
        m
      </span>
      <span
        className={`${STRAND_BASE} duration-[2900ms] opacity-0 group-hover:opacity-40 group-active:opacity-40 group-hover:-rotate-[180deg] group-active:-rotate-[180deg]`}
        style={{ ...OUTLINE_BASE, WebkitTextStrokeWidth: "0.6px" }}
      >
        m
      </span>
    </span>
  );
}
