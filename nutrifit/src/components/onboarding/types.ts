export type Gender = "masculino" | "feminino" | "outro";
export type ActivityLevel =
  | "sedentario"
  | "leve"
  | "moderado"
  | "intenso"
  | "atleta";

export type MedicalConditionKey =
  | "cardiaco"
  | "diabetes"
  | "lesoes_articulares"
  | "hipertensao"
  | "asma"
  | "colesterol"
  | "ansiedade";

export type OnboardingDraft = {
  nome: string;
  email: string;
  senha: string;

  alturaCm: number;
  pesoKg: number;
  idade: number;
  genero: Gender;
  nivelAtividade: ActivityLevel;

  condicoesMedicas: Record<MedicalConditionKey, boolean>;
  nomeAssistente: string;
};

export const medicalConditionsCatalog: Array<{
  key: MedicalConditionKey;
  title: string;
  desc: string;
  accent: "cyan" | "green" | "red" | "violet";
}> = [
  {
    key: "cardiaco",
    title: "Problemas Cardíacos",
    desc: "Histórico, arritmia ou acompanhamento.",
    accent: "red",
  },
  {
    key: "diabetes",
    title: "Diabetes",
    desc: "Tipo 1/2 ou resistência à insulina.",
    accent: "violet",
  },
  {
    key: "lesoes_articulares",
    title: "Lesões Articulares",
    desc: "Joelho, ombro, coluna ou limitação.",
    accent: "cyan",
  },
  {
    key: "hipertensao",
    title: "Hipertensão",
    desc: "Pressão alta ou medicação.",
    accent: "red",
  },
  {
    key: "asma",
    title: "Asma",
    desc: "Dificuldade respiratória em esforço.",
    accent: "cyan",
  },
  {
    key: "colesterol",
    title: "Colesterol Alto",
    desc: "LDL alto ou controle alimentar.",
    accent: "green",
  },
  {
    key: "ansiedade",
    title: "Ansiedade/Stress",
    desc: "Sono, compulsão ou oscilação.",
    accent: "violet",
  },
];

export const defaultDraft: OnboardingDraft = {
  nome: "",
  email: "",
  senha: "",
  alturaCm: 175,
  pesoKg: 75,
  idade: 28,
  genero: "masculino",
  nivelAtividade: "moderado",
  condicoesMedicas: {
    cardiaco: false,
    diabetes: false,
    lesoes_articulares: false,
    hipertensao: false,
    asma: false,
    colesterol: false,
    ansiedade: false,
  },
  nomeAssistente: "Athena",
};

