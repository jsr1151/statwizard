import React from "react";
import { MATH_TERMS } from "../../data/mathTerms";

const FormulaSigma = ({
  top,
  bottom,
  className = "",
  tooltipTerm,
  renderTerm,
}) => (
  <span
    className={`inline-flex flex-col items-center leading-none mx-1 ${className}`}
  >
    <span className="text-[10px] h-3 select-none">{renderTerm(top)}</span>
    <span
      className="text-2xl -my-1 select-none"
      title={tooltipTerm ? MATH_TERMS[tooltipTerm]?.desc : undefined}
    >
      Σ
    </span>
    <span className="text-[10px] h-3 select-none">{renderTerm(bottom)}</span>
  </span>
);

export default FormulaSigma;
