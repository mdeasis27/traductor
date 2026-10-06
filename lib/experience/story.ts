import type { Heading } from "@/design-system/demo/project-story";

type NodeCopy = { name: string; sub: string; analogy: string };

export interface TraductorStory {
  name: string;
  oneLiner: string;
  chips: string[];
  analogy: { heading: Heading; paragraphs: string[]; dictionaryLabel: string; dictionary: { term: string; means: string }[] };
  why: { title: string; text: string };
  tryIt: { heading: Heading; lead: string; question: (tables: number) => string; yes: string; no: string; tablesLabel: string; shelves: string[]; note: string; simulate: string; cancel: string; reset: string; error: string; idle: string };
  compare: { heading: Heading; lead: string; mine: (tables: number) => string; raw: string; wrong: string; sentence: (mine: number, raw: number) => string; verdict: (served: number) => string };
  fit: { heading: Heading; worthLabel: string; worth: string; notLabel: string; not: string };
  proves: { heading: Heading; text: string };
  engineers: { summary: string; points: string[]; repoLabel: string };
  scene: { title: string; caption: string; statusLabels: { active: string; danger: string; success: string }; tapeLabel: string; nodes: { questions: NodeCopy; librarian: NodeCopy; answered: NodeCopy; refused: NodeCopy }; tape: { served: string; rerouted: string; lost: string }; servedOf: (n: number) => string };
}

export const STORY: Record<"en" | "es", TraductorStory> = {
  en: {
    name: "Text to SQL",
    oneLiner: "A good librarian searches the shelves they know and tells you when what you asked for isn't there.",
    chips: ["Questions to data", "2 min", "Live demo"],
    analogy: {
      heading: { before: "The", accent: "analogy" },
      paragraphs: [
        "You ask a librarian for a book. If it sits on a shelf they know, they bring it. If it sits on a shelf they've never catalogued, a good one says so. A bad one hands you something close and lets you leave with the wrong book.",
        "Here the librarian turns questions in plain language into database queries. The shelves are the database tables. The slider decides how many of the three tables the librarian knows.",
      ],
      dictionaryLabel: "In the diagram below",
      dictionary: [
        { term: "the librarian", means: "the system that writes the query" },
        { term: "a shelf", means: "one database table" },
        { term: "bringing the book", means: "a query that returns the right answer" },
        { term: "saying it isn't there", means: "a polite refusal, with no guessing" },
      ],
    },
    why: { title: "Why I built it", text: "" },
    tryIt: {
      heading: { before: "Try", accent: "it" },
      lead: "Ten questions about customers, orders and payments. Each one is answered only with tables the librarian knows, and a guard checks every query before it runs.",
      question: (n) => `Before you run it, place a bet: knowing ${n} of the 3 tables, does the librarian answer at least 9 of the 10 questions?`,
      yes: "Yes, 9 or more",
      no: "No, fewer than 9",
      tablesLabel: "Tables the librarian knows",
      shelves: ["customers", "orders", "payments"],
      note: "Each square is one question, in order. Green got the right answer, blue was refused because the librarian doesn't know that table, red would be a wrong answer.",
      simulate: "Run it",
      cancel: "Cancel",
      reset: "Start over",
      error: "The questions could not be looked up. Try another number of tables.",
      idle: "Place your bet and press Run it.",
    },
    compare: {
      heading: { before: "With the guard", accent: "or the raw draft" },
      lead: "Same ten questions. One side uses the librarian and the guard; the other runs the model's first draft of each query as it came out.",
      mine: (n) => `Librarian with ${n} ${n === 1 ? "table" : "tables"}`,
      raw: "Raw draft, no guard",
      wrong: "wrong answers",
      sentence: (mine, raw) => {
        if (mine === raw) return `Both sides gave ${mine} wrong ${mine === 1 ? "answer" : "answers"}.`;
        if (mine > raw) return `This time the raw draft did better: ${raw} wrong against ${mine}.`;
        return `The librarian gave ${mine === 0 ? "no" : mine} wrong ${mine === 1 ? "answer" : "answers"}. The raw draft gave ${raw}: a made-up column, a table that doesn't exist and a query that would have changed data.`;
      },
      verdict: (n) => `${n} of 10 questions answered`,
    },
    fit: {
      heading: { before: "Where it", accent: "fits" },
      worthLabel: "Worth it",
      worth: "When people who don't write queries need numbers from the company's data, and a wrong number is worse than a polite refusal. I picture a sales team asking how many orders are pending.",
      notLabel: "Not needed",
      not: "When the questions are always the same handful; a fixed report answers them faster and with less risk.",
    },
    proves: {
      heading: { before: "What it", accent: "proves" },
      text: "I made refusing a normal outcome. When the librarian doesn't know a table, the page shows a blue square, and nobody receives a confident wrong answer.",
    },
    engineers: {
      summary: "For engineers",
      points: [
        "Questions are routed to ten parameterized templates; table and column names come only from the schema, so the generator can't invent them.",
        "A validator rejects unknown tables, unknown columns and write statements before anything runs. The slider trims the schema the generator and validator see.",
        "Per-question outcomes for 0 to 3 tables are pinned in a fixture read by the TypeScript and Python suites. The free-text router and the raw-draft comparison run in TypeScript only.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Source code",
    },
    scene: {
      title: "What the librarian did with each question",
      caption: "Watch each question go to a known shelf or get an honest refusal.",
      statusLabels: { active: "looking", success: "answered", danger: "wrong answer" },
      tapeLabel: "Ten questions, in order",
      nodes: {
        questions: { name: "Questions", sub: "10 in plain language", analogy: "the visitors" },
        librarian: { name: "Librarian", sub: "writes the query", analogy: "the librarian" },
        answered: { name: "Answered", sub: "checked query", analogy: "the right book" },
        refused: { name: "Refused", sub: "unknown table", analogy: "not on my shelves" },
      },
      tape: { served: "answered right", rerouted: "refused", lost: "wrong answer" },
      servedOf: (n) => `Questions answered: ${n} of 10`,
    },
  },
  es: {
    name: "Traductor",
    oneLiner: "Un buen bibliotecario busca en los estantes que conoce y te avisa cuando lo que pides no está ahí.",
    chips: ["Preguntas a datos", "2 min", "Demo en vivo"],
    analogy: {
      heading: { accent: "La analogía" },
      paragraphs: [
        "Le pides un libro a un bibliotecario. Si está en un estante que conoce, te lo trae. Si está en un estante que nunca ha catalogado, uno bueno te lo dice. Uno malo te da algo parecido y te vas con el libro equivocado.",
        "Aquí el bibliotecario convierte preguntas en lenguaje normal en consultas a una base de datos. Los estantes son las tablas. El slider decide cuántas de las tres tablas conoce el bibliotecario.",
      ],
      dictionaryLabel: "En el diagrama de abajo",
      dictionary: [
        { term: "el bibliotecario", means: "el sistema que escribe la consulta" },
        { term: "un estante", means: "una tabla de la base de datos" },
        { term: "traer el libro", means: "una consulta que da la respuesta correcta" },
        { term: "decir que no está", means: "un rechazo amable, sin adivinar" },
      ],
    },
    why: { title: "Por qué lo hice", text: "" },
    tryIt: {
      heading: { accent: "Pruébalo" },
      lead: "Diez preguntas sobre clientes, pedidos y pagos. Cada una se responde solo con las tablas que conoce el bibliotecario, y un revisor checa cada consulta antes de correrla.",
      question: (n) => `Antes de correrlo, apuesta: conociendo ${n} de las 3 tablas, ¿el bibliotecario responde al menos 9 de las 10 preguntas?`,
      yes: "Sí, 9 o más",
      no: "No, menos de 9",
      tablesLabel: "Tablas que conoce el bibliotecario",
      shelves: ["clientes", "pedidos", "pagos"],
      note: "Cada cuadrito es una pregunta, en orden. Verde dio la respuesta correcta, azul se rechazó porque el bibliotecario no conoce esa tabla, rojo sería una respuesta equivocada.",
      simulate: "Correr",
      cancel: "Cancelar",
      reset: "Empezar de nuevo",
      error: "No se pudieron buscar las preguntas. Prueba con otro número de tablas.",
      idle: "Haz tu apuesta y presiona Correr.",
    },
    compare: {
      heading: { before: "Con revisor", accent: "o el borrador crudo" },
      lead: "Las mismas diez preguntas. De un lado, el bibliotecario con el revisor; del otro, el primer borrador del modelo para cada consulta, tal como salió.",
      mine: (n) => `Bibliotecario con ${n} ${n === 1 ? "tabla" : "tablas"}`,
      raw: "Borrador crudo, sin revisor",
      wrong: "respuestas equivocadas",
      sentence: (mine, raw) => {
        if (mine === raw) return `Los dos lados dieron ${mine} ${mine === 1 ? "respuesta equivocada" : "respuestas equivocadas"}.`;
        if (mine > raw) return `Esta vez al borrador crudo le fue mejor: ${raw} equivocadas contra ${mine}.`;
        return `El bibliotecario dio ${mine === 0 ? "cero respuestas equivocadas" : mine === 1 ? "1 respuesta equivocada" : `${mine} respuestas equivocadas`}. El borrador crudo dio ${raw}: una columna inventada, una tabla que no existe y una consulta que habría modificado datos.`;
      },
      verdict: (n) => `${n} de 10 preguntas respondidas`,
    },
    fit: {
      heading: { before: "¿Dónde", accent: "sirve", after: "?" },
      worthLabel: "Vale la pena",
      worth: "Cuando personas que no escriben consultas necesitan números de los datos de la empresa, y un número equivocado es peor que un rechazo amable. Pienso en un equipo de ventas que pregunta cuántos pedidos siguen pendientes.",
      notLabel: "No hace falta",
      not: "Cuando las preguntas son siempre las mismas cinco o seis; un reporte fijo las responde más rápido y con menos riesgo.",
    },
    proves: {
      heading: { before: "Lo que", accent: "demuestra" },
      text: "Hice que rechazar fuera un resultado normal. Cuando el bibliotecario no conoce una tabla, la página muestra un cuadrito azul y nadie recibe una respuesta equivocada dicha con seguridad.",
    },
    engineers: {
      summary: "Para ingenieros",
      points: [
        "Las preguntas se dirigen a diez plantillas con parámetros; los nombres de tablas y columnas salen solo del esquema, así que el generador no puede inventarlos.",
        "Un validador rechaza tablas y columnas desconocidas y cualquier instrucción que escriba datos antes de correr nada. El slider recorta el esquema que ven el generador y el validador.",
        "Los resultados por pregunta para 0 a 3 tablas están fijados en un fixture que leen las pruebas de TypeScript y de Python. El enrutador de texto libre y la comparación con el borrador crudo corren solo en TypeScript.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Código fuente",
    },
    scene: {
      title: "Lo que hizo el bibliotecario con cada pregunta",
      caption: "Mira cómo cada pregunta va a un estante conocido o recibe un rechazo honesto.",
      statusLabels: { active: "buscando", success: "respondió", danger: "respuesta equivocada" },
      tapeLabel: "Diez preguntas, en orden",
      nodes: {
        questions: { name: "Preguntas", sub: "10 en lenguaje normal", analogy: "los visitantes" },
        librarian: { name: "Bibliotecario", sub: "escribe la consulta", analogy: "el bibliotecario" },
        answered: { name: "Respondida", sub: "consulta revisada", analogy: "el libro correcto" },
        refused: { name: "Rechazada", sub: "tabla desconocida", analogy: "no está en mis estantes" },
      },
      tape: { served: "respondida bien", rerouted: "rechazada", lost: "respuesta equivocada" },
      servedOf: (n) => `Preguntas respondidas: ${n} de 10`,
    },
  },
};
