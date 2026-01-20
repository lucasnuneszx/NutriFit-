export type MuscleGroup =
  | "peito"
  | "costas"
  | "pernas"
  | "ombros"
  | "bracos"
  | "core";

export type WorkoutVariation = {
  id: string;
  title: string;
  cues: string[];
};

export type WorkoutExercise = {
  id: string;
  title: string;
  variations: WorkoutVariation[];
};

export type WorkoutGroup = {
  id: MuscleGroup;
  title: string;
  subtitle: string;
  accent: "cyan" | "green" | "red" | "violet";
  exercises: WorkoutExercise[];
};

export const workoutCatalog: WorkoutGroup[] = [
  {
    id: "peito",
    title: "Peito",
    subtitle: "presses, estabilidade e controle.",
    accent: "cyan",
    exercises: [
      {
        id: "supino",
        title: "Supino",
        variations: [
          {
            id: "supino-reto",
            title: "Supino Reto (barra)",
            cues: ["escápulas encaixadas", "cotovelos 45°", "controle na descida"],
          },
          {
            id: "supino-halteres",
            title: "Supino com halteres",
            cues: ["amplitude confortável", "punhos neutros", "subida explosiva"],
          },
        ],
      },
      {
        id: "crucifixo",
        title: "Crucifixo",
        variations: [
          {
            id: "crucifixo-cabo",
            title: "Crossover (cabos)",
            cues: ["leve inclinação", "peito alto", "contração no centro"],
          },
        ],
      },
    ],
  },
  {
    id: "costas",
    title: "Costas",
    subtitle: "puxadas, dorsais e postura.",
    accent: "violet",
    exercises: [
      {
        id: "puxada",
        title: "Puxada",
        variations: [
          {
            id: "barra-fixa",
            title: "Barra fixa",
            cues: ["peito no alvo", "escápulas primeiro", "sem balanço"],
          },
          {
            id: "puxada-frente",
            title: "Puxada na frente (polia)",
            cues: ["cotovelos pra baixo", "segura 1s", "controle total"],
          },
        ],
      },
      {
        id: "remada",
        title: "Remada",
        variations: [
          {
            id: "remada-curvada",
            title: "Remada curvada",
            cues: ["coluna neutra", "cotovelos junto", "sem roubar"],
          },
        ],
      },
    ],
  },
  {
    id: "pernas",
    title: "Pernas",
    subtitle: "agachamento, força e potência.",
    accent: "green",
    exercises: [
      {
        id: "agachamento",
        title: "Agachamento",
        variations: [
          {
            id: "agacho-livre",
            title: "Agachamento livre",
            cues: ["joelhos acompanham pés", "bracing forte", "profundidade segura"],
          },
          {
            id: "leg-press",
            title: "Leg press",
            cues: ["controle", "não travar joelhos", "amplitude consistente"],
          },
        ],
      },
      {
        id: "levantamento-terra",
        title: "Levantamento terra",
        variations: [
          {
            id: "terra-romeno",
            title: "RDL (romeno)",
            cues: ["quadril pra trás", "barra colada", "isquios alongando"],
          },
        ],
      },
    ],
  },
  {
    id: "ombros",
    title: "Ombros",
    subtitle: "press, deltoide e simetria.",
    accent: "cyan",
    exercises: [
      {
        id: "desenvolvimento",
        title: "Desenvolvimento",
        variations: [
          {
            id: "desenv-halteres",
            title: "Desenvolvimento com halteres",
            cues: ["glúteos firmes", "costelas baixas", "sem compensar lombar"],
          },
        ],
      },
      {
        id: "elevacao-lateral",
        title: "Elevação lateral",
        variations: [
          {
            id: "lateral-cabo",
            title: "Elevação lateral no cabo",
            cues: ["cotovelo guia", "subida controlada", "pausa no topo"],
          },
        ],
      },
    ],
  },
  {
    id: "bracos",
    title: "Braços",
    subtitle: "bíceps e tríceps com volume.",
    accent: "red",
    exercises: [
      {
        id: "rosca",
        title: "Rosca",
        variations: [
          {
            id: "rosca-direta",
            title: "Rosca direta",
            cues: ["cotovelos fixos", "sem balanço", "controle total"],
          },
        ],
      },
      {
        id: "triceps",
        title: "Tríceps",
        variations: [
          {
            id: "triceps-polia",
            title: "Tríceps na polia",
            cues: ["cotovelos colados", "extensão completa", "pausa 1s"],
          },
        ],
      },
    ],
  },
  {
    id: "core",
    title: "Core",
    subtitle: "estabilidade, anti-rotação e performance.",
    accent: "violet",
    exercises: [
      {
        id: "prancha",
        title: "Prancha",
        variations: [
          {
            id: "prancha-alta",
            title: "Prancha alta",
            cues: ["glúteos firmes", "ombros estáveis", "respiração controlada"],
          },
        ],
      },
      {
        id: "pallof",
        title: "Pallof press",
        variations: [
          {
            id: "pallof-cabo",
            title: "Pallof no cabo",
            cues: ["quadril neutro", "anti-rotação", "pausa no centro"],
          },
        ],
      },
    ],
  },
];

