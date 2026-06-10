const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, PageNumber, PageOrientation
} = require('docx');
const fs = require('fs');

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────────
const GREEN      = "008753";
const GREEN_LIGHT= "E6F7F0";
const GREEN_DARK = "005C3A";
const DARK       = "0F172A";
const SLATE      = "475569";
const LIGHT_BG   = "F8FAFC";
const WHITE      = "FFFFFF";
const BORDER_COL = "CBD5E1";
const AMBER      = "C2410C";
const AMBER_BG   = "FFF7ED";
const BLUE       = "1D4ED8";
const BLUE_BG    = "EFF6FF";
const RED        = "DC2626";
const RED_BG     = "FEF2F2";
const PURPLE     = "6B21A8";
const PURPLE_BG  = "F3E8FF";

// ── HELPERS ────────────────────────────────────────────────────────────────────
function border(col=BORDER_COL) {
  const b = { style: BorderStyle.SINGLE, size: 1, color: col };
  return { top: b, bottom: b, left: b, right: b };
}
function noBorder() {
  const b = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: b, bottom: b, left: b, right: b };
}
function cell(children, opts={}) {
  return new TableCell({
    borders: opts.borders !== undefined ? opts.borders : border(),
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    verticalAlign: opts.vAlign || undefined,
    columnSpan: opts.colSpan || undefined,
    children: Array.isArray(children) ? children : [children]
  });
}
function p(text, opts={}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before || 0, after: opts.after || 60 },
    numbering: opts.numbering,
    border: opts.border,
    children: [new TextRun({
      text,
      bold: opts.bold || false,
      italics: opts.italic || false,
      size: opts.size || 22,
      color: opts.color || DARK,
      font: "Arial",
      allCaps: opts.caps || false
    })]
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: DARK, font: "Arial" })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 28, color: GREEN_DARK, font: "Arial" })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: DARK, font: "Arial" })]
  });
}
function li(text, ref="bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, color: SLATE, font: "Arial" })]
  });
}
function space(n=1) {
  return new Paragraph({ spacing: { before: 0, after: n * 100 }, children: [new TextRun("")] });
}
function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}
function colorBlock(title, rows, fill, titleFill, titleColor=WHITE) {
  const headerCells = [
    cell(p(title, { bold: true, size: 24, color: titleColor }), { fill: titleFill, borders: noBorder(), width: 9360 })
  ];
  const dataRows = rows.map(([label, value]) =>
    new TableRow({ children: [
      cell(p(label, { bold: true, size: 20, color: DARK }), { fill: LIGHT_BG, width: 3000 }),
      cell(p(value, { size: 20, color: SLATE }), { fill: WHITE, width: 6360 })
    ]})
  );
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({ children: headerCells }),
      ...dataRows
    ]
  });
}
function kpiRow(items) {
  // items: [{label, value, fill}]
  const w = Math.floor(9360 / items.length);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: items.map(() => w),
    rows: [new TableRow({
      children: items.map(item =>
        new TableCell({
          borders: noBorder(),
          width: { size: w, type: WidthType.DXA },
          shading: { fill: item.fill || GREEN_LIGHT, type: ShadingType.CLEAR },
          margins: { top: 140, bottom: 140, left: 140, right: 140 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.value, bold: true, size: 36, color: GREEN_DARK, font: "Arial" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.label, size: 18, color: SLATE, font: "Arial" })] })
          ]
        })
      )
    })]
  });
}
function twoCol(left, right, leftW=4500) {
  const rightW = 9360 - leftW - 80;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    rows: [new TableRow({ children: [
      cell(left, { width: leftW, borders: noBorder() }),
      cell(right, { width: rightW, borders: noBorder() })
    ]})]
  });
}
function sectionHeader(num, title, subtitle="") {
  return [
    space(2),
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({ text: `${num}. `, bold: true, size: 40, color: GREEN, font: "Arial" }),
        new TextRun({ text: title.toUpperCase(), bold: true, size: 40, color: DARK, font: "Arial" })
      ]
    }),
    subtitle ? p(subtitle, { color: SLATE, size: 20, italic: true, after: 120 }) : space(0.5)
  ];
}

// ── FULL-WIDTH TABLE HELPERS ───────────────────────────────────────────────────
function fullTable(headers, rows, fillHeader=GREEN) {
  const colW = Math.floor(9360 / headers.length);
  const colWidths = headers.map(() => colW);
  const headerRow = new TableRow({
    children: headers.map(h => cell(
      p(h, { bold: true, size: 18, color: WHITE }),
      { fill: fillHeader, width: colW }
    ))
  });
  const bodyRows = rows.map((row, i) => new TableRow({
    children: row.map((v, j) => cell(
      p(v, { size: 18, color: DARK }),
      { fill: i % 2 === 0 ? WHITE : LIGHT_BG, width: colW }
    ))
  }));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows]
  });
}
function swotTable() {
  const w = 4500;
  const gap = 360;
  const innerW = 4500;
  function quadrant(title, items, fill, titleFill) {
    return new TableCell({
      borders: noBorder(),
      width: { size: innerW, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: title, bold: true, size: 22, color: titleFill, font: "Arial" })] }),
        ...items.map(t => new Paragraph({ spacing: { before: 40, after: 40 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: t, size: 20, color: DARK, font: "Arial" })] }))
      ]
    });
  }
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [w, 360, w],
    rows: [
      new TableRow({ children: [
        quadrant("💪 FORCES", [
          "Premier comparateur bancaire en Tunisie",
          "Données structurées sur 30+ banques",
          "Chatbot IA spécialisé banque tunisienne",
          "Expérience UX mobile premium",
          "Coût de lancement faible (< 30k DT)"
        ], GREEN_LIGHT, GREEN_DARK),
        cell(p(""), { width: 360, borders: noBorder() }),
        quadrant("⚠️ FAIBLESSES", [
          "Marque inconnue au démarrage",
          "Dépendance à la collecte manuelle des données",
          "Pas d'API officielle des banques tunisiennes",
          "Équipe fondatrice réduite",
          "Revenus B2C limités en phase 1"
        ], RED_BG, RED)
      ]}),
      new TableRow({ children: [cell(p(""), { colSpan: 3, borders: noBorder() })] }),
      new TableRow({ children: [
        quadrant("🚀 OPPORTUNITÉS", [
          "6,4M d'internautes tunisiens non servis",
          "Réforme BCT sur transparence tarifaire",
          "Croissance du mobile banking (+34%/an)",
          "Aucun concurrent direct identifié",
          "Expansion MENA à moyen terme"
        ], BLUE_BG, BLUE),
        cell(p(""), { width: 360, borders: noBorder() }),
        quadrant("🔴 MENACES", [
          "Banques développant leurs propres apps",
          "Réglementation BCT restrictive possible",
          "Résistance des banques à partager tarifs",
          "Concurrent régional bien financé",
          "Faible culture de comparaison en ligne"
        ], AMBER_BG, AMBER)
      ]})
    ]
  });
}

// ── BMC CANVAS ─────────────────────────────────────────────────────────────────
function bmcCell(title, items, fillH, fillB, w) {
  return new TableCell({
    borders: border("AAAAAA"),
    width: { size: w, type: WidthType.DXA },
    shading: { fill: fillB, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 16, color: WHITE, font: "Arial" })] }),
      new Paragraph({
        spacing: { before: 0, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: fillH } },
        children: [new TextRun({ text: "", size: 4 })]
      }),
      ...items.map(t => new Paragraph({
        spacing: { before: 20, after: 20 },
        children: [new TextRun({ text: `• ${t}`, size: 17, color: DARK, font: "Arial" })]
      }))
    ]
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENT BUILD
// ══════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, font: "Arial", color: DARK }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial", color: GREEN_DARK }, paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial", color: DARK }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    children: [

      // ─────────────────────────────────────────────────────────────────────
      // PAGE DE COUVERTURE
      // ─────────────────────────────────────────────────────────────────────
      space(4),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "🏦", size: 80, font: "Arial" })]
      }),
      space(1),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: "BANKLY", bold: true, size: 72, color: GREEN_DARK, font: "Arial", allCaps: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "Comparateur & Agrégateur Bancaire — Tunisie", size: 30, color: SLATE, font: "Arial" })]
      }),
      space(1),
      new Table({
        width: { size: 5000, type: WidthType.DXA },
        columnWidths: [5000],
        rows: [new TableRow({ children: [cell(
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BUSINESS PLAN & BUSINESS MODEL CANVAS", bold: true, size: 24, color: WHITE, font: "Arial" })] }),
          { fill: GREEN, borders: noBorder() }
        )] })]
      }),
      space(2),
      new Table({
        width: { size: 5000, type: WidthType.DXA },
        columnWidths: [2200, 2800],
        rows: [
          ["Version", "1.0 — Juin 2025"],
          ["Fondateur", "Amine Ben —"],
          ["Marché cible", "Tunisie (puis MENA)"],
          ["Modèle", "B2B2C — SaaS + Affiliation"],
          ["Horizon", "36 mois (2025–2028)"]
        ].map(([k,v]) => new TableRow({ children: [
          cell(p(k, { bold: true, size: 20, color: DARK }), { fill: LIGHT_BG, width: 2200 }),
          cell(p(v, { size: 20, color: SLATE }), { fill: WHITE, width: 2800 })
        ]}))
      }),
      space(3),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Document confidentiel — Usage interne & investisseurs", size: 18, color: SLATE, italics: true, font: "Arial" })]
      }),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 0. SOMMAIRE
      // ─────────────────────────────────────────────────────────────────────
      h1("Table des Matières"),
      ...([
        ["1", "Résumé Exécutif", "3"],
        ["2", "Présentation du Projet", "4"],
        ["3", "Analyse de Marché", "5"],
        ["4", "Analyse SWOT", "7"],
        ["5", "Modèle Économique", "8"],
        ["6", "Business Model Canvas (BMC)", "10"],
        ["7", "Stratégie Marketing & Acquisition", "12"],
        ["8", "Plan Opérationnel & Roadmap Produit", "14"],
        ["9", "Structure Juridique & Organisation", "16"],
        ["10", "Plan Financier Prévisionnel", "17"],
        ["11", "Stratégie de Financement", "20"],
        ["12", "Analyse des Risques & Mitigation", "21"],
        ["13", "Indicateurs de Performance (KPIs)", "22"],
        ["14", "Annexes", "23"],
      ].map(([num, title, page]) =>
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({ text: `${num}. ${title}`, size: 22, color: DARK, font: "Arial" }),
            new TextRun({ text: `  .....  p.${page}`, size: 22, color: SLATE, font: "Arial" })
          ]
        })
      )),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 1. RÉSUMÉ EXÉCUTIF
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("1", "Résumé Exécutif", "Vue d'ensemble du projet et proposition de valeur"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [cell(
          [
            p("Bankly est la première plateforme mobile tunisienne dédiée à la comparaison, l'agrégation et l'analyse des services bancaires. Dans un pays où 6,4 millions de tunisiens utilisent Internet et où la transparence tarifaire bancaire reste insuffisante malgré la circulaire BCT 2017-06, Bankly comble un vide structurel en offrant aux particuliers et aux entreprises un outil intelligent de navigation dans l'écosystème bancaire local.", { size: 21, color: DARK }),
            space(0.5),
            p("La plateforme s'articule autour de trois piliers : un comparateur de frais et services en temps réel, un assistant IA spécialisé en réglementation bancaire tunisienne, et un tableau de bord d'alertes et recommandations personnalisées. Son modèle économique hybride repose sur la publicité native B2B (banques), l'affiliation sur produits financiers et des abonnements premium.", { size: 21, color: DARK })
          ],
          { fill: GREEN_LIGHT, borders: noBorder() }
        )] })]
      }),
      space(1),
      kpiRow([
        { label: "Marché Adressable", value: "6,4M", fill: GREEN_LIGHT },
        { label: "Banques Cibles", value: "23", fill: BLUE_BG },
        { label: "Rev. An-3", value: "890k DT", fill: PURPLE_BG },
        { label: "Break-even", value: "Mois 18", fill: AMBER_BG }
      ]),
      space(1),
      h3("Points Clés"),
      li("Aucun concurrent direct identifié sur le marché tunisien"),
      li("Coût de lancement estimé à 28 000 DT — bootstrappable"),
      li("Potentiel de croissance vers le marché MENA (Algérie, Maroc, Libye)"),
      li("Aligné avec la réforme BCT sur la transparence et l'inclusion financière"),
      li("Technologie IA embarquée différenciante et évolutive"),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 2. PRÉSENTATION DU PROJET
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("2", "Présentation du Projet", "Mission, vision, et proposition de valeur unique"),

      h2("2.1 Mission & Vision"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4500, 4860],
        rows: [new TableRow({ children: [
          cell([
            p("🎯 MISSION", { bold: true, size: 22, color: GREEN_DARK }),
            space(0.3),
            p("Démocratiser l'accès à l'information bancaire en Tunisie en offrant à chaque citoyen un outil transparent, intelligent et gratuit pour comparer, comprendre et optimiser ses services financiers.", { size: 20, color: DARK })
          ], { fill: GREEN_LIGHT, width: 4500 }),
          cell([
            p("🔭 VISION 2030", { bold: true, size: 22, color: BLUE }),
            space(0.3),
            p("Devenir la référence MENA en matière de comparaison de services financiers — le Bankrate ou MoneySuperMarket de l'Afrique du Nord — en couvrant banques, assurances, télécoms et fintech.", { size: 20, color: DARK })
          ], { fill: BLUE_BG, width: 4860 })
        ]})]
      }),
      space(1),

      h2("2.2 Le Problème Résolu"),
      fullTable(
        ["Problème Client", "Impact Actuel", "Solution Bankly"],
        [
          ["Opacité des frais bancaires", "Le client ne sait pas comparer avant d'ouvrir un compte", "Comparateur structuré et visuel"],
          ["Information dispersée", "Visite obligatoire de chaque site/agence", "Agrégation centralisée en temps réel"],
          ["Méconnaissance des droits BCT", "Paiement de services gratuits par ignorance", "Chatbot IA réglementaire"],
          ["Absence de recommandations", "Choix de banque par défaut ou bouche-à-oreille", "Algorithme de scoring personnalisé"],
          ["Aucune alerte sur les taux", "TMM et taux crédit non suivis", "Notifications push intelligentes"],
        ]
      ),
      space(1),

      h2("2.3 Proposition de Valeur Unique (UVP)"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [cell(
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [
            new TextRun({ text: '"La banque parfaite pour vous — en 60 secondes."', bold: true, size: 30, color: GREEN_DARK, font: "Arial", italics: true })
          ]}),
          { fill: GREEN_LIGHT, borders: noBorder() }
        )] })]
      }),
      space(1),
      p("Bankly est la seule plateforme tunisienne qui combine comparaison tarifaire exhaustive, assistance IA réglementaire et recommandation personnalisée dans une interface mobile-first, gratuite pour les particuliers.", { size: 21 }),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 3. ANALYSE DE MARCHÉ
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("3", "Analyse de Marché", "Taille du marché, segmentation et positionnement concurrentiel"),

      h2("3.1 Taille & Structure du Marché"),
      kpiRow([
        { label: "Internautes tunisiens (2024)", value: "6,4M", fill: GREEN_LIGHT },
        { label: "Taux bancarisation", value: "47%", fill: BLUE_BG },
        { label: "Banques actives en TN", value: "23", fill: PURPLE_BG },
        { label: "Croissance mobile banking", value: "+34%/an", fill: AMBER_BG }
      ]),
      space(1),

      h2("3.2 Segmentation du Marché"),
      fullTable(
        ["Segment", "Taille Estimée", "Besoin Principal", "Priorité"],
        [
          ["Particuliers bancarisés 18-45 ans", "2,8M", "Comparer frais & choisir le bon compte", "⭐⭐⭐"],
          ["Entrepreneurs & PME", "450k", "Optimiser frais pro & accès crédit", "⭐⭐⭐"],
          ["Non-bancarisés en transition", "1,2M", "S'informer avant première ouverture", "⭐⭐"],
          ["Étudiants & primo-accédants", "380k", "Compte gratuit, carte, virements", "⭐⭐⭐"],
          ["Expatriés (diaspora)", "180k", "Transferts internationaux, change", "⭐⭐"],
        ]
      ),
      space(1),

      h2("3.3 Analyse Concurrentielle"),
      fullTable(
        ["Acteur", "Type", "Forces", "Faiblesses", "Menace"],
        [
          ["Apps bancaires natives (BIAT, STB...)", "Concurrent indirect", "Base installée, confiance", "Partiel, biaisé vers propre banque", "Moyenne"],
          ["Sites banques (comparatif)", "Concurrent indirect", "Autorité de marque", "Pas de comparaison multi-banques", "Faible"],
          ["Comparafia.com (MAR)", "Concurrent potentiel", "Modèle prouvé Maroc", "Non présent en Tunisie", "Forte si entrée"],
          ["Yomken / Expat.com", "Substitut partiel", "Communauté active", "Non spécialisé banking", "Faible"],
          ["Aucun comparateur tunisien", "Vide concurrentiel", "N/A", "N/A", "—"],
        ]
      ),
      space(1),

      h2("3.4 Tendances de Marché"),
      li("Circulaire BCT 2017-06 : obligation de transparence tarifaire pour toutes les banques"),
      li("Stratégie nationale d'inclusion financière 2023–2027 : objectif 65% de bancarisation"),
      li("Croissance du m-banking : +34%/an selon la BCT — 2,1M d'utilisateurs actifs mobiles"),
      li("Adoption de l'IA en Afrique du Nord : marché fintech MENA à 3,4 Mds USD d'ici 2026"),
      li("Génération Z et Millennials : 68% préfèrent comparer en ligne avant de choisir une banque"),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 4. ANALYSE SWOT
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("4", "Analyse SWOT", "Forces, Faiblesses, Opportunités et Menaces"),
      swotTable(),
      space(1),
      h3("Plan d'action issu du SWOT"),
      fullTable(
        ["Axe SO — Exploiter", "Axe ST — Protéger", "Axe WO — Améliorer", "Axe WT — Éviter"],
        [
          [
            "Lancer avant tout concurrent (window of opportunity 12 mois)",
            "Signer des accords data avec banques avant réglementation restrictive",
            "Recruter un data analyst BCT dès la série A",
            "Ne pas dépendre d'un seul canal d'acquisition"
          ]
        ]
      ),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 5. MODÈLE ÉCONOMIQUE
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("5", "Modèle Économique", "Sources de revenus, structure de coûts et pricing"),

      h2("5.1 Sources de Revenus"),
      fullTable(
        ["Stream", "Mécanisme", "Cible", "Revenue An-1 (DT)", "Revenue An-3 (DT)"],
        [
          ["Publicité native B2B", "Banques paient pour visibilité premium dans le comparateur", "23 banques TN", "45 000", "210 000"],
          ["Affiliation (leads)", "Commission par ouverture de compte / crédit accordé", "Banques partenaires", "12 000", "180 000"],
          ["Abonnement Premium (B2C)", "Fonctions avancées : alertes taux, export, historique", "PME & power users", "8 000", "145 000"],
          ["API Data B2B (SaaS)", "Accès aux données structurées pour fintechs, assureurs", "Fintechs, courtiers", "0", "220 000"],
          ["Partenariats institutionnels", "BCT, associations consommateurs, médias financiers", "Secteur public", "5 000", "135 000"],
          ["TOTAL", "", "", "70 000 DT", "890 000 DT"],
        ]
      ),
      space(1),

      h2("5.2 Structure de Coûts"),
      fullTable(
        ["Poste", "Nature", "Coût An-1 (DT)", "Coût An-3 (DT)"],
        [
          ["Développement Mobile (iOS/Android)", "Fixe — Capital", "18 000", "8 000"],
          ["Hébergement Cloud (AWS/Hetzner)", "Variable", "3 600", "12 000"],
          ["Data Collection & Veille", "Variable", "2 400", "8 400"],
          ["Marketing & Acquisition", "Variable", "8 000", "45 000"],
          ["Masse salariale (2→6 ETP)", "Fixe", "28 000", "108 000"],
          ["Juridique & Comptable", "Fixe", "2 400", "4 800"],
          ["R&D IA / Chatbot", "Fixe", "4 000", "18 000"],
          ["TOTAL COÛTS", "", "66 400 DT", "204 200 DT"],
        ]
      ),
      space(1),

      h2("5.3 Pricing — Abonnements"),
      fullTable(
        ["Plan", "Cible", "Prix", "Fonctionnalités"],
        [
          ["Free", "Grand public", "0 DT", "Comparateur, 3 banques, alertes basiques"],
          ["Premium", "Particuliers actifs", "4,9 DT/mois", "Toutes banques, alertes taux, historique, export PDF"],
          ["Pro", "PME & entrepreneurs", "19,9 DT/mois", "Dashboard multi-comptes, API légère, rapport mensuel"],
          ["Entreprise", "Fintechs, courtiers", "Sur devis", "API complète, données brutes, SLA garanti"],
        ]
      ),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 6. BUSINESS MODEL CANVAS
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("6", "Business Model Canvas (BMC)", "Vue synthétique sur 9 blocs stratégiques"),
      space(0.5),

      // BMC Table — 3 rows
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1872, 1872, 1872, 1872, 1872],
        rows: [
          // Row 1: KP | KA | VP | CR | CS
          new TableRow({ children: [
            bmcCell("🤝 Partenaires Clés", [
              "BCT (données réglementaires)",
              "23 banques tunisiennes",
              "Fintechs partenaires",
              "Agences digitales",
              "Universités & incubateurs",
              "AWS / Firebase (cloud)"
            ], GREEN, "1A3626", 1872),
            new TableCell({
              borders: border("AAAAAA"),
              width: { size: 1872, type: WidthType.DXA },
              shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "⚙️ ACTIVITÉS CLÉS", bold: true, size: 16, color: WHITE, font: "Arial" })] }),
                ...["Collecte & structuration des données bancaires","Développement & maintenance app mobile","Entraînement chatbot IA BCT","Acquisition & partenariats B2B","Veille tarifaire hebdomadaire"].map(t => new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: `• ${t}`, size: 17, color: DARK, font: "Arial" })] })),
                space(1),
                new Paragraph({ children: [new TextRun({ text: "🔑 RESSOURCES CLÉS", bold: true, size: 16, color: WHITE, font: "Arial" })] }),
                ...["Base de données tarifaires tunisiennes","Algorithme de scoring propriétaire","IA conversationnelle banking TN","Équipe tech + product bi-lingue","Réseau bancaire (relations)"].map(t => new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: `• ${t}`, size: 17, color: DARK, font: "Arial" })] }))
              ]
            }),
            bmcCell("💎 Proposition de Valeur", [
              "Pour les Particuliers :",
              "→ Comparer 23 banques en 60s",
              "→ Connaître ses droits BCT",
              "→ Économiser sur les frais",
              "",
              "Pour les Banques :",
              "→ Visibilité qualifiée",
              "→ Leads convertis",
              "→ Benchmark concurrentiel",
              "",
              "Pour les PME :",
              "→ Optimiser les frais pro",
              "→ Accès crédit simplifié"
            ], GREEN, "1A5C3A", 1872),
            new TableCell({
              borders: border("AAAAAA"),
              width: { size: 1872, type: WidthType.DXA },
              shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "💬 RELATIONS CLIENTS", bold: true, size: 16, color: WHITE, font: "Arial" })] }),
                ...["Self-service (app autonome)","Chatbot IA 24/7","Notifications personnalisées","FAQ & guides banking","Support email premium","Communauté (forum Q&A)"].map(t => new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: `• ${t}`, size: 17, color: DARK, font: "Arial" })] })),
                space(1),
                new Paragraph({ children: [new TextRun({ text: "📣 CANAUX", bold: true, size: 16, color: WHITE, font: "Arial" })] }),
                ...["App Store / Google Play","SEO/SEM tunisien","Instagram & TikTok","Presse financière (Kapitalis)","Partenariats banques","Bouche-à-oreille"].map(t => new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: `• ${t}`, size: 17, color: DARK, font: "Arial" })] }))
              ]
            }),
            bmcCell("👥 Segments Clients", [
              "B2C — Prioritaire :",
              "→ 18-45 ans, bancarisés",
              "→ PME & entrepreneurs",
              "→ Étudiants primo-accédants",
              "→ Diaspora tunisienne",
              "",
              "B2B — Revenus :",
              "→ 23 banques tunisiennes",
              "→ Compagnies d'assurance",
              "→ Fintechs & néobanques",
              "→ Médias financiers"
            ], GREEN, "1A3626", 1872),
          ]}),
          // Row 2: COSTS | REVENUE
          new TableRow({ children: [
            new TableCell({
              borders: border("AAAAAA"),
              width: { size: 4680, type: WidthType.DXA },
              columnSpan: 2,
              shading: { fill: RED_BG, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "💸 STRUCTURE DE COÛTS", bold: true, size: 18, color: RED, font: "Arial" })] }),
                new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Coûts principaux : Développement mobile (18k DT) • Masse salariale (28k DT an-1) • Cloud (3,6k DT) • Marketing (8k DT) • R&D IA (4k DT) | Total An-1 : 66 400 DT", size: 19, color: DARK, font: "Arial" })] })
              ]
            }),
            new TableCell({
              borders: border("AAAAAA"),
              width: { size: 4680, type: WidthType.DXA },
              columnSpan: 3,
              shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "💰 FLUX DE REVENUS", bold: true, size: 18, color: GREEN_DARK, font: "Arial" })] }),
                new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Publicité native B2B (45k DT) • Affiliation leads (12k DT) • Abonnements Premium (8k DT) • Partenariats (5k DT) | Total An-1 : 70 000 DT | An-3 : 890 000 DT", size: 19, color: DARK, font: "Arial" })] })
              ]
            }),
          ]})
        ]
      }),
      space(1),
      p("Le BMC ci-dessus synthétise la logique de valeur de Bankly : un modèle à double face (two-sided marketplace) qui crée de la valeur pour les utilisateurs finaux (information gratuite, transparence) tout en monétisant la visibilité et les leads auprès des banques partenaires.", { size: 20, color: SLATE, italic: true }),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 7. STRATÉGIE MARKETING & ACQUISITION
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("7", "Stratégie Marketing & Acquisition", "Go-to-market, canaux d'acquisition et stratégie de marque"),

      h2("7.1 Positionnement de Marque"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [new TableRow({ children: [
          cell([p("🎨 Identité", { bold: true, color: GREEN_DARK }), p("FinTech premium, sobre, de confiance. Vert émeraude + noir profond. Typographie moderne sans-serif.", { size: 20 })], { fill: GREEN_LIGHT, width: 3120 }),
          cell([p("🗣️ Ton de Communication", { bold: true, color: BLUE }), p("Expert mais accessible. Pas de jargon inutile. Pédagogique et rassurant pour le grand public tunisien.", { size: 20 })], { fill: BLUE_BG, width: 3120 }),
          cell([p("🏆 Positionnement", { bold: true, color: PURPLE }), p("Le conseiller bancaire digital impartial — aucun lien capitalistique avec les banques comparées.", { size: 20 })], { fill: PURPLE_BG, width: 3120 }),
        ]})]
      }),
      space(1),

      h2("7.2 Plan d'Acquisition par Canal"),
      fullTable(
        ["Canal", "Tactique", "Budget An-1", "KPI", "Horizon"],
        [
          ["SEO Organique", "100+ articles 'Banques en Tunisie', guides BCT, comparatifs", "800 DT (rédaction)", "5k visites/mois mois 6", "0-12 mois"],
          ["Instagram / TikTok", "Contenu éducatif : 'Droits BCT en 60s', comparatifs visuels", "1 200 DT/an", "10k followers mois 6", "0-6 mois"],
          ["App Store Optimization", "Mots-clés : 'banque tunisie', 'comparateur bancaire', reviews", "0 DT", "Top 5 Finance Store TN", "0-3 mois"],
          ["Partenariats Media", "Kapitalis, L'Économiste Maghrébin, Webmanagercenter", "2 000 DT", "3 articles/mois", "3-9 mois"],
          ["B2B Direct (banques)", "Cold outreach, présentation deck banques partenaires", "1 500 DT", "3 partenariats signés", "3-12 mois"],
          ["Référencement Google Ads", "Campagnes CPC : 'ouvrir compte banque tunisie'", "2 500 DT", "CPA < 4 DT", "6-12 mois"],
        ]
      ),
      space(1),

      h2("7.3 Funnel de Conversion"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1872, 1872, 1872, 1872, 1872],
        rows: [new TableRow({ children: [
          cell([p("👁️ AWARENESS", { bold: true, size: 18, color: WHITE }), p("SEO, Social Media, Presse", { size: 17, color: SLATE })], { fill: "334155", width: 1872 }),
          cell([p("🔍 CONSIDÉRATION", { bold: true, size: 18, color: WHITE }), p("Comparateur gratuit, Blog", { size: 17, color: SLATE })], { fill: "475569", width: 1872 }),
          cell([p("✅ ACTIVATION", { bold: true, size: 18, color: WHITE }), p("Inscription, 1ère comparaison", { size: 17, color: SLATE })], { fill: GREEN_DARK, width: 1872 }),
          cell([p("💳 MONÉTISATION", { bold: true, size: 18, color: WHITE }), p("Premium, Clic affiliation", { size: 17, color: SLATE })], { fill: GREEN, width: 1872 }),
          cell([p("🔁 RÉTENTION", { bold: true, size: 18, color: WHITE }), p("Alertes, Push, NPS", { size: 17, color: SLATE })], { fill: GREEN_DARK, width: 1872 }),
        ]})]
      }),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 8. PLAN OPÉRATIONNEL & ROADMAP
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("8", "Plan Opérationnel & Roadmap Produit", "Phases de développement et jalons clés sur 36 mois"),

      h2("8.1 Roadmap par Phase"),
      fullTable(
        ["Phase", "Période", "Objectifs Produit", "Objectifs Business", "Budget"],
        [
          ["Phase 0 — Fondation", "M0–M3", "MVP web/mobile, 5 banques, comparateur basique, chatbot règles BCT", "Validation 100 beta users, 1er partenariat banque", "8 000 DT"],
          ["Phase 1 — Lancement", "M4–M9", "App iOS+Android, 15 banques, alertes push, SEO, comptes utilisateurs", "1 000 utilisateurs actifs, 3 banques partenaires, 1er revenu", "20 000 DT"],
          ["Phase 2 — Croissance", "M10–M18", "23 banques, chatbot IA avancé, Premium, API partenaires, dashboard PME", "10 000 MAU, break-even, 30k DT revenus/mois", "45 000 DT"],
          ["Phase 3 — Expansion", "M19–M30", "Module assurances, module change devises, app Algérie/Maroc", "50 000 MAU, 890k DT revenus annuels, levée Série A", "120 000 DT"],
          ["Phase 4 — Scale", "M31–M36", "MENA expansion, API ouverte, marché institutionnel", "Leader MENA comparaison financière", "Sur financement"],
        ]
      ),
      space(1),

      h2("8.2 Architecture Technologique"),
      fullTable(
        ["Couche", "Technologie", "Justification"],
        [
          ["Frontend Mobile", "React Native (iOS + Android)", "Une codebase, déploiement simultané, communauté large"],
          ["Backend API", "Node.js + Fastify / Python FastAPI", "Performance, scalabilité, rapidité de développement"],
          ["Base de Données", "PostgreSQL + Redis (cache)", "Données structurées + cache requêtes fréquentes"],
          ["IA / Chatbot", "Claude API (Anthropic) + RAG", "Réponses réglementaires précises via documents BCT"],
          ["Cloud & DevOps", "AWS (EC2, RDS, S3) / Hetzner TN", "Fiabilité + option souveraineté données tunisiennes"],
          ["Analytics", "Mixpanel + Metabase", "Tracking comportemental + reporting interne"],
          ["Paiements", "Flouci / Konnect (TN)", "Intégration locale pour abonnements Premium"],
        ]
      ),
      space(1),

      h2("8.3 Équipe & Recrutement"),
      fullTable(
        ["Poste", "Phase", "Profil", "Salaire Mensuel (DT)"],
        [
          ["Fondateur / CEO-CPO", "M0+", "Amine — Stratégie, product, partnerships", "Equity only → 2 500 DT M6+"],
          ["Développeur Full-Stack", "M1+", "3+ ans, React Native + Node.js, TN-based", "1 800–2 200 DT"],
          ["Data Analyst / Scraping", "M3+", "Python, collecte data bancaire, veille BCT", "1 400–1 800 DT"],
          ["Growth Marketer", "M6+", "SEO, Social, acquisition digitale TN", "1 200–1 600 DT"],
          ["BD Manager (banques)", "M9+", "Réseau bancaire tunisien, vente B2B", "1 500 + commission"],
          ["AI/ML Engineer", "M12+", "NLP, RAG, fine-tuning LLM sur données BCT", "2 000–2 800 DT"],
        ]
      ),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 9. STRUCTURE JURIDIQUE
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("9", "Structure Juridique & Organisation", "Forme légale, gouvernance et conformité"),

      h2("9.1 Forme Juridique Recommandée"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 6360],
        rows: [
          [["Forme recommandée", "SUARL (Société Unipersonnelle à Responsabilité Limitée)"]],
          [["Capital minimum", "1 000 DT (libérable à 50% à la création)"]],
          [["Localisation", "Tunis — Zone Startup Act si éligible"]],
          [["Label Startup Act", "Demander le label IPME/ANME pour avantages fiscaux 8 ans"]],
          [["TVA", "Régime réel — collecte TVA sur services B2B"]],
          [["Protection IP", "Dépôt marque BANKLY à l'INNORPI (130 DT) dès M0"]],
        ].map(([[k,v]]) => new TableRow({ children: [
          cell(p(k, { bold: true, size: 20 }), { fill: LIGHT_BG, width: 3000 }),
          cell(p(v, { size: 20, color: SLATE }), { fill: WHITE, width: 6360 })
        ]}))
      }),
      space(1),

      h2("9.2 Conformité & Réglementation"),
      li("RGPD-like : Loi organique 2004-63 sur les données personnelles — politique de confidentialité obligatoire"),
      li("Déclaration auprès de l'INPDP pour traitement de données financières"),
      li("Pas de licence bancaire requise (activité d'information, non de services financiers)"),
      li("Conditions d'utilisation claires : Bankly est un comparateur, non un conseiller financier agréé"),
      li("Audit légal annuel requis pour maintien label Startup Act"),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 10. PLAN FINANCIER PRÉVISIONNEL
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("10", "Plan Financier Prévisionnel", "P&L, Cash-flow et scénarios de croissance sur 3 ans"),

      h2("10.1 Compte de Résultat Prévisionnel (en DT)"),
      fullTable(
        ["Poste", "Année 1", "Année 2", "Année 3"],
        [
          ["REVENUS TOTAUX", "70 000", "310 000", "890 000"],
          ["  Publicité B2B", "45 000", "130 000", "210 000"],
          ["  Affiliation", "12 000", "70 000", "180 000"],
          ["  Abonnements Premium", "8 000", "55 000", "145 000"],
          ["  API Data (SaaS)", "0", "25 000", "220 000"],
          ["  Institutionnel", "5 000", "30 000", "135 000"],
          ["CHARGES TOTALES", "66 400", "148 000", "204 200"],
          ["  Développement", "22 000", "18 000", "26 000"],
          ["  Salaires", "28 000", "72 000", "108 000"],
          ["  Marketing", "8 000", "28 000", "45 000"],
          ["  Infra & Cloud", "3 600", "7 200", "12 000"],
          ["  Admin & Légal", "4 800", "7 200", "8 400"],
          ["  R&D IA", "4 000", "15 600", "18 000 (net)"],
          ["RÉSULTAT D'EXPLOITATION", "+ 3 600", "+ 162 000", "+ 685 800"],
          ["MARGE NETTE", "5,1%", "52,3%", "77,1%"],
        ]
      ),
      space(1),

      h2("10.2 Point Mort (Break-Even)"),
      kpiRow([
        { label: "Coûts Fixes Mensuels", value: "4 200 DT", fill: RED_BG },
        { label: "Rev. Moyen/Client Premium", value: "4,9 DT/mois", fill: BLUE_BG },
        { label: "Break-even utilisateurs", value: "857", fill: AMBER_BG },
        { label: "Break-even calendaire", value: "Mois 18", fill: GREEN_LIGHT }
      ]),
      space(1),

      h2("10.3 Scénarios de Croissance"),
      fullTable(
        ["Scénario", "Hypothèse", "Utilisateurs An-3", "Revenus An-3", "Valorisation (x5)"],
        [
          ["🔴 Pessimiste", "Adoption lente, 1 partenaire banque, pas d'IA", "8 000 MAU", "180 000 DT", "900 000 DT"],
          ["🟡 Base (Plan)", "3 partenaires, croissance organique, Premium 2%", "35 000 MAU", "890 000 DT", "4 450 000 DT"],
          ["🟢 Optimiste", "Viral, 8 partenaires banques, expansion Algérie", "95 000 MAU", "2 100 000 DT", "10 500 000 DT"],
        ]
      ),
      space(1),

      h2("10.4 Besoin en Fonds de Roulement — Année 1"),
      fullTable(
        ["Trimestre", "Dépenses", "Revenus", "Cash Net", "Cumul"],
        [
          ["T1 (M1-M3)", "24 000 DT", "0 DT", "-24 000 DT", "-24 000 DT"],
          ["T2 (M4-M6)", "18 000 DT", "8 000 DT", "-10 000 DT", "-34 000 DT"],
          ["T3 (M7-M9)", "14 000 DT", "22 000 DT", "+8 000 DT", "-26 000 DT"],
          ["T4 (M10-M12)", "10 400 DT", "40 000 DT", "+29 600 DT", "+3 600 DT"],
        ]
      ),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 11. STRATÉGIE DE FINANCEMENT
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("11", "Stratégie de Financement", "Sources de capital, jalons de levée et dilution"),

      h2("11.1 Plan de Financement par Phase"),
      fullTable(
        ["Phase", "Montant", "Source", "Utilisation", "Dilution"],
        [
          ["Seed (M0-M3)", "28 000 DT", "Fondateur (bootstrapping)", "MVP + légal + infra", "0%"],
          ["Pre-Seed (M6-M9)", "80 000 DT", "Business Angels TN / ANME", "Équipe + marketing + data", "15-20%"],
          ["Série A (M18-M24)", "500 000 DT", "Fonds VC (Flat6Labs, SICAR)", "Scale + expansion MENA", "20-25%"],
          ["Série B (M30+)", "2 000 000 DT", "VC international (MENA tech)", "Internationalisation", "15-20%"],
        ]
      ),
      space(1),

      h2("11.2 Sources de Financement Tunisiennes"),
      li("ANME (Agence Nationale de Maîtrise de l'Énergie) — subventions startup tech : jusqu'à 100k DT"),
      li("BFPME (Banque de Financement des PME) — prêts à taux bonifiés"),
      li("Startup Act Tunisie — exonérations fiscales 8 ans + accès facilité aux SICAR"),
      li("Flat6Labs Tunis — programme d'accélération avec ticket 40-80k USD"),
      li("Enpact / GIZ — programmes d'appui aux startups fintech MENA"),
      li("Crowdfunding local (Zoomaal, Afrikwity) — validation marché + traction"),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 12. ANALYSE DES RISQUES
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("12", "Analyse des Risques & Mitigation", "Matrice des risques et plans de contingence"),

      h2("12.1 Matrice des Risques"),
      fullTable(
        ["Risque", "Probabilité", "Impact", "Score", "Mitigation"],
        [
          ["Résistance des banques à partager tarifs", "Élevée", "Élevé", "🔴 Critique", "Collecte manuelle + scraping légal + pression BCT"],
          ["Entrée d'un concurrent financé", "Moyenne", "Élevé", "🟠 Majeur", "Accélération roadmap, lock-in partenariats exclusifs"],
          ["Réglementation BCT restrictive sur comparateurs", "Faible", "Élevé", "🟡 Modéré", "Dialogue proactif BCT, respect strict INPDP"],
          ["Qualité des données (erreurs tarifs)", "Élevée", "Moyen", "🟠 Majeur", "Processus de vérification + clause disclaimer légal"],
          ["Faible adoption (churn élevé)", "Moyenne", "Moyen", "🟡 Modéré", "Tests UX continus, notifications valeur ajoutée"],
          ["Dépendance API IA (coût Anthropic)", "Faible", "Moyen", "🟢 Faible", "Budget API prévu + fine-tuning modèle open-source"],
        ]
      ),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 13. KPIs
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("13", "Indicateurs de Performance (KPIs)", "Tableau de bord stratégique sur 36 mois"),

      h2("13.1 KPIs Produit"),
      fullTable(
        ["KPI", "Mois 6", "Mois 12", "Mois 24", "Mois 36"],
        [
          ["MAU (Monthly Active Users)", "1 000", "5 000", "25 000", "75 000"],
          ["DAU/MAU (Stickiness)", "18%", "22%", "28%", "35%"],
          ["Session Duration (moy.)", "2m30s", "3m15s", "4m00s", "4m30s"],
          ["Comparaisons effectuées/mois", "3 000", "18 000", "95 000", "280 000"],
          ["App Store Rating", "4.0+", "4.2+", "4.5+", "4.6+"],
          ["Taux de conversion Premium", "—", "1%", "2.2%", "3.5%"],
        ]
      ),
      space(1),

      h2("13.2 KPIs Business"),
      fullTable(
        ["KPI", "Mois 6", "Mois 12", "Mois 24", "Mois 36"],
        [
          ["Revenus Mensuels (DT)", "2 000", "8 500", "32 000", "74 000"],
          ["Banques Partenaires", "1", "3", "8", "15"],
          ["NPS (Net Promoter Score)", "30+", "40+", "50+", "60+"],
          ["CAC (Coût Acquisition Client)", "—", "4 DT", "2,5 DT", "1,8 DT"],
          ["LTV (Lifetime Value Premium)", "—", "29 DT", "49 DT", "70 DT"],
          ["LTV/CAC Ratio", "—", "7x", "20x", "39x"],
        ]
      ),
      pb(),

      // ─────────────────────────────────────────────────────────────────────
      // 14. ANNEXES
      // ─────────────────────────────────────────────────────────────────────
      ...sectionHeader("14", "Annexes", "Documents complémentaires et références"),

      h2("Annexe A — Références Réglementaires"),
      li("Circulaire BCT n°2017-06 : Tarification des services bancaires"),
      li("Loi organique n°2004-63 : Protection des données personnelles (INPDP)"),
      li("Décret n°2018-417 : Startup Act Tunisie"),
      li("Stratégie nationale d'inclusion financière BCT 2023–2027"),
      li("Rapport BCT 2024 : État du système bancaire tunisien"),
      space(1),

      h2("Annexe B — Benchmark Comparateurs Financiers Internationaux"),
      fullTable(
        ["Nom", "Pays", "Modèle", "Valorisation", "Leçon clé"],
        [
          ["Bankrate", "USA", "SEO + Affiliation", "1,24 Mds USD", "SEO = actif dominant"],
          ["MoneySuperMarket", "UK", "Affiliation multi-produit", "1,6 Mds GBP", "Diversification rapide"],
          ["Comparafia", "Maroc", "B2B + Affiliation", "Non divulguée", "Modèle MENA validé"],
          ["Yodlee (now Envestnet)", "USA", "API Data B2B", "590M USD", "La data vaut plus que l'app"],
        ]
      ),
      space(1),

      h2("Annexe C — Lexique Bancaire Tunisien"),
      fullTable(
        ["Terme", "Définition"],
        [
          ["BCT", "Banque Centrale de Tunisie — régulateur et superviseur du système bancaire"],
          ["TMM", "Taux du Marché Monétaire — taux directeur du marché interbancaire (7.99% jan. 2025)"],
          ["CIB", "Carte Interbancaire — carte nationale tunisienne (réseau CMI)"],
          ["SICAR", "Société d'Investissement en Capital Risque — véhicule d'investissement startup"],
          ["BFPME", "Banque de Financement des PME — financement public PME"],
          ["INNORPI", "Institut National de la Normalisation et de la Propriété Industrielle"],
          ["MAU", "Monthly Active Users — utilisateurs actifs mensuels"],
          ["LTV", "Lifetime Value — valeur totale générée par un client sur sa durée de vie"],
        ]
      ),
      space(2),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "— FIN DU DOCUMENT —", bold: true, size: 22, color: SLATE, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Bankly © 2025 — Document Confidentiel — Tous droits réservés", size: 18, color: SLATE, font: "Arial", italics: true })]
      }),

    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/Bankly_Business_Plan_2025.docx', buf);
  console.log('Done');
});
