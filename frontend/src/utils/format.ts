export const n = (value?: number | null, digits = 1) =>
  Number(value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: digits });

export const profileLabel = (profile: string) => {
  const text = String(profile ?? '').replace(/_/g, ' ').toLowerCase();
  return text.replace(/^./, (c: string) => c.toUpperCase());
};
