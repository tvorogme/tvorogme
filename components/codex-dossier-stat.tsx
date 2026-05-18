type CodexDossierStatProps = {
  readonly label: string;
  readonly prefix?: string;
  readonly value: number;
};

export function CodexDossierStat({
  label,
  prefix = "",
  value,
}: CodexDossierStatProps) {
  return (
    <span>
      <b>{label}</b>
      <strong>
        {prefix}
        {formatCompactNumber(value)}
      </strong>
    </span>
  );
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    notation: Math.abs(value) >= 10000 ? "compact" : "standard",
  }).format(value);
}
