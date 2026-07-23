const COLOR_CO = "#EAB308";
const COLOR_PRE = "#3B82F6";
const COLOR_UNLOCK = "#22C55E";

function edgeVisual(kind, role) {
  const strokeDasharray = kind === "co" ? "5 5" : undefined;
  if (role === "dim") return { style: { color: 'dim' } };
  if (role === "base") return { style: { color: 'base' } };

  const color =
    kind === "co"
      ? COLOR_CO
      : role === "unlock"
        ? COLOR_UNLOCK
        : COLOR_PRE;
        
  return {
    style: { stroke: color, strokeWidth: 2.75, strokeDasharray },
    markerColor: color,
  };
}

console.log("co + prereq:", edgeVisual("co", "prereq"));
console.log("co + unlock:", edgeVisual("co", "unlock"));
console.log("pre + prereq:", edgeVisual("pre", "prereq"));
