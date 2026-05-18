// Decorativa: la "m" del marchio in Glassure.
// Al passaggio del cursore (e al tap su touch) si scompone in più filamenti
// del proprio profilo che ruotano a velocità e angoli diversi, dando
// l'effetto di una matassa che si avvolge e si srotola. Pure CSS.

const STRAND_BASE =
  "absolute inset-0 flex items-center justify-center font-glassure text-[7rem] sm:text-[9rem] leading-none transition-all duration-[2000ms] ease-in-out origin-center pointer-events-none";

const OUTLINE_STYLE: React.CSSProperties = {
  color: "transparent",
  WebkitTextStrokeColor: "#b45309", // amber-700
};

export function MatassaM() {
  return (
    <div className="relative group shrink-0 select-none w-28 h-28 sm:w-40 sm:h-40 flex items-center justify-center">
      {/* m piena: stato di riposo, ruota dolcemente */}
      <span
        className="font-glassure text-[7rem] sm:text-[9rem] leading-none text-neutral-900 group-hover:text-amber-700 group-active:text-amber-700 transition-all duration-[2000ms] ease-in-out group-hover:rotate-[720deg] group-active:rotate-[720deg] inline-block origin-center"
        aria-hidden
      >
        m
      </span>

      {/* Filamenti: profili della stessa m sovrapposti che si srotolano
          ad angoli e velocità diversi. Invisibili a riposo. */}
      <span
        className={`${STRAND_BASE} opacity-0 group-hover:opacity-90 group-active:opacity-90 group-hover:rotate-[540deg] group-active:rotate-[540deg]`}
        style={{ ...OUTLINE_STYLE, WebkitTextStrokeWidth: "1px" }}
        aria-hidden
      >
        m
      </span>
      <span
        className={`${STRAND_BASE} opacity-0 group-hover:opacity-70 group-active:opacity-70 duration-[2300ms] group-hover:-rotate-[360deg] group-active:-rotate-[360deg]`}
        style={{ ...OUTLINE_STYLE, WebkitTextStrokeWidth: "0.8px" }}
        aria-hidden
      >
        m
      </span>
      <span
        className={`${STRAND_BASE} opacity-0 group-hover:opacity-55 group-active:opacity-55 duration-[2600ms] group-hover:rotate-[900deg] group-active:rotate-[900deg]`}
        style={{ ...OUTLINE_STYLE, WebkitTextStrokeWidth: "0.7px" }}
        aria-hidden
      >
        m
      </span>
      <span
        className={`${STRAND_BASE} opacity-0 group-hover:opacity-40 group-active:opacity-40 duration-[2900ms] group-hover:-rotate-[180deg] group-active:-rotate-[180deg]`}
        style={{ ...OUTLINE_STYLE, WebkitTextStrokeWidth: "0.6px" }}
        aria-hidden
      >
        m
      </span>
    </div>
  );
}
