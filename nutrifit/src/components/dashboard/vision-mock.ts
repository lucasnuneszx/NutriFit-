export type VisionFoodResult = {
  title: string;
  items: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

const samples: VisionFoodResult[] = [
  {
    title: "Bowl Proteico",
    items: ["frango grelhado", "arroz", "legumes", "azeite"],
    calories: 610,
    protein_g: 46,
    carbs_g: 58,
    fats_g: 18,
  },
  {
    title: "Café + Whey",
    items: ["café", "whey", "banana"],
    calories: 360,
    protein_g: 32,
    carbs_g: 40,
    fats_g: 6,
  },
  {
    title: "Dia do Lixo (controlado)",
    items: ["pizza (2 fatias)", "refrigerante zero"],
    calories: 520,
    protein_g: 22,
    carbs_g: 55,
    fats_g: 24,
  },
];

export function pickMockResult(seed: number): VisionFoodResult {
  const idx = Math.abs(seed) % samples.length;
  return samples[idx]!;
}

