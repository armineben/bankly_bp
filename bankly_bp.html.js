const fs = require('fs');

// ── DESIGN TOKENS (Convertis en classes ou variables CSS) ─────────────────────
const styles = `
<style>
  :root {
    --green: #008753;
    --green-light: #e6f7f0;
    --green-dark: #005c3a;
    --dark: #0f172a;
    --slate: #475569;
    --light-bg: #f8fafc;
    --white: #ffffff;
    --border-col: #cbd5e1;
    --amber: #c2410c;
    --amber-bg: #fff7ed;
    --blue: #1d4ed8;
    --blue-bg: #eff6ff;
    --red: #dc2626;
    --red-bg: #fef2f2;
    --purple: #6b21a8;
    --purple-bg: #f3e8ff;
  }
  body { font-family: 'Arial', sans-serif; color: var(--dark); line-height: 1.5; max-width: 900px; margin: 40px auto; padding: 0 20px; background-color: #fff; }
  h1 { font-size: 24pt; font-weight: bold; margin-top: 36px; margin-bottom: 20px; color: var(--dark); }
  h2 { font-size: 19pt; font-weight: bold; margin-top: 30px; margin-bottom: 16px; color: var(--green-dark); border-bottom: 3px solid var(--green); padding-bottom: 4px; }
  h3 { font-size: 16pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: var(--dark); }
  p { font-size: 11pt; color: var(--dark); margin: 0 0 10px 0; }
  ul { margin: 8px 0; padding-left: 24px; }
  li { font-size: 11pt; color: var(--slate); margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
  td, th { border: 1px solid var(--border-col); padding: 8px 12px; vertical-align: top; }
  .page-break { border-top: 2px dashed #e2e8f0; margin: 40px 0; padding-top: 20px; }
  .cover { text-align: center; padding: 60px 0; }
  
  /* Layout Helpers */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
  .flex-kpi { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 20px; }
  .kpi-card { flex: 1; padding: 15px; border-radius: 6px; text-align: center; }
  .bmc-cell { border: 1px solid #aaa; padding: 10px; font-size: 8.5pt; }
</style>
`;

// ── HELPERS REÉCRITS POUR LE HTML ──────────────────────────────────────────────
function cell(content, opts={}) {
  const bg = opts.fill ? `background-color: #${opts.fill};` : '';
  const borderStyle = opts.borders === 'none' ? 'border: none;' : '';
  const span = opts.colSpan ? ` colspan="${opts.colSpan}"` : '';
  return `<td style="${bg} ${borderStyle}"${span}>${content}</td>`;
}

function p(text, opts={}) {
  let style = '';
  if (opts.bold) style += 'font-weight: bold;';
  if (opts.italic) style += 'font-style: italic;';
  if (opts.color) style += `color: #${opts.color};`;
  if (opts.size) style += `font-size: ${opts.size / 2}pt;`;
  if (opts.align) style += `text-align: ${opts.align.toLowerCase()};`;
  return `<p style="${style}">${text}</p>`;
}

function h1(text) { return `<h1>${text}</h1>`; }
function h2(text) { return `<h2>${text}</h2>`; }
function h3(text) { return `<h3>${text}</h3>`; }
function li(text) { return `<li>${text}</li>`; }
function space(n=1) { return `<div style="height: ${n * 15}px;"></div>`; }
function pb() { return `<div class="page-break"></div>`; }

function colorBlock(title, rows, fill, titleFill, titleColor="FFFFFF") {
  const dataRows = rows.map(([label, value]) => `
    <tr>
      <td style="background-color: #${LIGHT_BG}; font-weight: bold; width: 30%;">${label}</td>
      <td style="background-color: #ffffff; color: #${SLATE};">${value}</td>
    </tr>
  `).join('');
  
  return `
    <table>
      <tr><th style="background-color: #${titleFill}; color: #${titleColor}; text-align: left; border: none;" colspan="2"><h3>${title}</h3></th></tr>
      ${dataRows}
    </table>
  `;
}

function kpiRow(items) {
  const cards = items.map(item => `
    <div class="kpi-card" style="background-color: #${item.fill || GREEN_LIGHT};">
      <div style="font-size: 18pt; font-weight: bold; color: #${GREEN_DARK};">${item.value}</div>
      <div style="font-size: 9pt; color: #${SLATE};">${item.label}</div>
    </div>
  `).join('');
  return `<div class="flex-kpi">${cards}</div>`;
}

function twoCol(left, right) {
  return `<div class="grid-2"><div>${left}</div><div>${right}</div></div>`;
}

function sectionHeader(num, title, subtitle="") {
  return `
    ${space(2)}
    <div style="margin-bottom: 15px;">
      <span style="font-size: 20pt; font-weight: bold; color: #${GREEN};">${num}. </span>
      <span style="font-size: 20pt; font-weight: bold; color: #${DARK}; text-transform: uppercase;">${title}</span>
      ${subtitle ? `<p style="color: #${SLATE}; font-size: 10pt; font-style: italic; margin-top: 5px;">${subtitle}</p>` : space(0.5)}
    </div>
  `;
}

function fullTable(headers, rows, fillHeader=GREEN) {
  const ths = headers.map(h => `<th style="background-color: #${fillHeader}; color: #ffffff; text-align: left;">${h}</th>`).join('');
  const trs = rows.map((row, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : `#${LIGHT_BG}`;
    return `<tr style="background-color: ${bg};">${row.map(v => `<td>${v}</td>`).join('')}</tr>`;
  }).join('');
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function swotTable() {
  function quadrant(title, items, fill, titleFill) {
    return `
      <div style="background-color: #${fill}; padding: 15px; border-radius: 4px; height: 100%;">
        <div style="font-weight: bold; font-size: 11pt; color: #${titleFill}; margin-bottom: 8px;">${title}</div>
        <ul>${items.map(t => `<li style="color: #${DARK}; font-size: 10pt;">${t}</li>`).join('')}</ul>
      </div>
    `;
  }
  return `
    <div class="grid-2">
      ${quadrant("💪 FORCES", ["Premier comparateur bancaire en Tunisie", "Données structurées sur 30+ banques", "Chatbot IA spécialisé banque tunisienne", "Expérience UX mobile premium", "Coût de lancement faible (&lt; 30k DT)"], GREEN_LIGHT, GREEN_DARK)}
      ${quadrant("⚠️ FAIBLESSES", ["Marque inconnue au démarrage", "Dépendance à la collecte manuelle des données", "Pas d'API officielle des banques tunisiennes", "Équipe fondatrice réduite", "Revenus B2C limités en phase 1"], RED_BG, RED)}
    </div>
    <div style="height: 20px;"></div>
    <div class="grid-2">
      ${quadrant("🚀 OPPORTUNITÉS", ["6,4M d'internautes tunisiens non servis", "Réforme BCT sur transparence tarifaire", "Croissance du mobile banking (+34%/an)", "Aucun concurrent direct identifié", "Expansion MENA à moyen terme"], BLUE_BG, BLUE)}
      ${quadrant("🔴 MENACES", ["Banques développant leurs propres apps", "Réglementation BCT restrictive possible", "Résistance des banques à partager tarifs", "Concurrent régional bien financé", "Faible culture de comparaison en ligne"], AMBER_BG, AMBER)}
    </div>
  `;
}

function bmcCell(title, items, fillH, fillB) {
  return `
    <div class="bmc-cell" style="background-color: #${fillB};">
      <div style="font-weight: bold; color: #ffffff; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #${fillH}; padding-bottom: 2px;">${title}</div>
      ${items.map(t => `<div style="color: #${DARK}; margin: 2px 0;">• ${t}</div>`).join('')}
    </div>
  `;
}

// ── BUILD RUNNER ──────────────────────────────────────────────────────────────
let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bankly - Business Plan & BMC</title>
  ${styles}
</head>
<body>
`;

// PAGE DE COUVERTURE
htmlContent += `
  <div class="cover">
    ${space(4)}
    <div style="font-size: 60pt;">🏦</div>
    ${space(1)}
    <div style="font-size: 54pt; font-weight: bold; color: #${GREEN_DARK}; letter-spacing: 2px;">BANKLY</div>
    <div style="font-size: 22pt; color: #${SLATE};">Comparateur & Agrégateur Bancaire — Tunisie</div>
    ${space(2)}
    <div style="background-color: #${GREEN}; color: #fff; display: inline-block; padding: 10px 40px; font-weight: bold; font-size: 16pt; border-radius: 4px;">
      BUSINESS PLAN & BUSINESS MODEL CANVAS
    </div>
    ${space(2)}
    <div style="max-width: 400px; margin: 0 auto; text-align: left;">
      ${colorBlock("Détails du projet", [
        ["Version", "1.0 — Juin 2025"],
        ["Fondateur", "Amine Ben —"],
        ["Marché cible", "Tunisie (puis MENA)"],
        ["Modèle", "B2B2C — SaaS + Affiliation"],
        ["Horizon", "36 mois (2025–2028)"]
      ], LIGHT_BG, GREEN_DARK)}
    </div>
    ${space(3)}
    <p style="color: #${SLATE}; font-style: italic;">Document confidentiel — Usage interne & investisseurs</p>
  </div>
  ${pb()}
`;

// SOMMAIRE
htmlContent += `
  ${h1("Table des Matières")}
  <ul style="list-style: none; padding: 0;">
    ${[
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
    ].map(([num, title, page]) => `
      <li style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #cbd5e1; color: #${DARK};">
        <span><b>${num}.</b> ${title}</span><span>p.${page}</span>
      </li>
    `).join('')}
  </ul>
  ${pb()}
`;

// 1. RÉSUMÉ EXÉCUTIF
htmlContent += `
  ${sectionHeader("1", "Résumé Exécutif", "Vue d'ensemble du projet et proposition de valeur")}
  <div style="background-color: #${GREEN_LIGHT}; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
    ${p("Bankly est la première plateforme mobile tunisienne dédiée à la comparaison, l'agrégation et l'analyse des services bancaires. Dans un pays où 6,4 millions de tunisiens utilisent Internet et où la transparence tarifaire bancaire reste insuffisante malgré la circulaire BCT 2017-06, Bankly comble un vide structurel en offrant aux particuliers et aux entreprises un outil intelligent de navigation dans l'écosystème bancaire local.")}
    ${p("La plateforme s'articule autour de trois piliers : un comparateur de frais et services en temps réel, un assistant IA spécialisé en réglementation bancaire tunisienne, et un tableau de bord d'alertes et recommandations personnalisées. Son modèle économique hybride repose sur la publicité native B2B (banques), l'affiliation sur produits financiers et des abonnements premium.")}
  </div>
  ${kpiRow([
    { label: "Marché Adressable", value: "6,4M", fill: GREEN_LIGHT },
    { label: "Banques Cibles", value: "23", fill: BLUE_BG },
    { label: "Rev. An-3", value: "890k DT", fill: PURPLE_BG },
    { label: "Break-even", value: "Mois 18", fill: AMBER_BG }
  ])}
  ${h3("Points Clés")}
  <ul>
    ${li("Aucun concurrent direct identifié sur le marché tunisien")}
    ${li("Coût de lancement estimé à 28 000 DT — bootstrappable")}
    ${li("Potentiel de croissance vers le marché MENA (Algérie, Maroc, Libye)")}
    ${li("Aligné avec la réforme BCT sur la transparence et l'inclusion financière")}
    ${li("Technologie IA embarquée différenciante et évolutive")}
  </ul>
  ${pb()}
`;

// 2. PRÉSENTATION DU PROJET
htmlContent += `
  ${sectionHeader("2", "Présentation du Projet", "Mission, vision, et proposition de valeur unique")}
  ${h2("2.1 Mission & Vision")}
  <div class="grid-2">
    <div style="background-color: #${GREEN_LIGHT}; padding: 15px; border-radius: 4px;">
      <div style="font-weight: bold; color: #${GREEN_DARK}; margin-bottom: 5px;">🎯 MISSION</div>
      ${p("Démocratiser l'accès à l'information bancaire en Tunisie en offrant à chaque citoyen un outil transparent, intelligent et gratuit pour comparer, comprendre et optimiser ses services financiers.")}
    </div>
    <div style="background-color: #${BLUE_BG}; padding: 15px; border-radius: 4px;">
      <div style="font-weight: bold; color: #${BLUE}; margin-bottom: 5px;">🔭 VISION 2030</div>
      ${p("Devenir la référence MENA en matière de comparaison de services financiers — le Bankrate ou MoneySuperMarket de l'Afrique du Nord — en couvrant banques, assurances, télécoms et fintech.")}
    </div>
  </div>
  
  ${h2("2.2 Le Problème Résolu")}
  ${fullTable(
    ["Problème Client", "Impact Actuel", "Solution Bankly"],
    [
      ["Opacité des frais bancaires", "Le client ne sait pas comparer avant d'ouvrir un compte", "Comparateur structuré et visuel"],
      ["Information dispersée", "Visite obligatoire de chaque site/agence", "Agrégation centralisée en temps réel"],
      ["Méconnaissance des droits BCT", "Paiement de services gratuits par ignorance", "Chatbot IA réglementaire"],
      ["Absence de recommandations", "Choix de banque par défaut ou bouche-à-oreille", "Algorithme de scoring personnalisé"],
      ["Aucune alerte sur les taux", "TMM et taux crédit non suivis", "Notifications push intelligentes"],
    ]
  )}

  ${h2("2.3 Proposition de Valeur Unique (UVP)")}
  <div style="background-color: #${GREEN_LIGHT}; text-align: center; padding: 20px; border-radius: 4px; font-style: italic; font-size: 14pt; font-weight: bold; color: #${GREEN_DARK}; margin-bottom: 15px;">
    "La banque parfaite pour vous — en 60 secondes."
  </div>
  ${p("Bankly est la seule plateforme tunisienne qui combine comparaison tarifaire exhaustive, assistance IA réglementaire et recommandation personnalisée dans une interface mobile-first, gratuite pour les particuliers.")}
  ${pb()}
`;

// 3. ANALYSE DE MARCHÉ
htmlContent += `
  ${sectionHeader("3", "Analyse de Marché", "Taille du marché, segmentation et positionnement concurrentiel")}
  ${h2("3.1 Taille & Structure du Marché")}
  ${kpiRow([
    { label: "Internautes tunisiens (2024)", value: "6,4M", fill: GREEN_LIGHT },
    { label: "Taux bancarisation", value: "47%", fill: BLUE_BG },
    { label: "Banques actives en TN", value: "23", fill: PURPLE_BG },
    { label: "Croissance mobile banking", value: "+34%/an", fill: AMBER_BG }
  ])}

  ${h2("3.2 Segmentation du Marché")}
  ${fullTable(
    ["Segment", "Taille Estimée", "Besoin Principal", "Priorité"],
    [
      ["Particuliers bancarisés 18-45 ans", "2,8M", "Comparer frais & choisir le bon compte", "⭐⭐⭐"],
      ["Entrepreneurs & PME", "450k", "Optimiser frais pro & accès crédit", "⭐⭐⭐"],
      ["Non-bancarisés en transition", "1,2M", "S'informer avant première ouverture", "⭐⭐"],
      ["Étudiants & primo-accédants", "380k", "Compte gratuit, carte, virements", "⭐⭐⭐"],
      ["Expatriés (diaspora)", "180k", "Transferts internationaux, change", "⭐⭐"],
    ]
  )}

  ${h2("3.3 Analyse Concurrentielle")}
  ${fullTable(
    ["Acteur", "Type", "Forces", "Faiblesses", "Menace"],
    [
      ["Apps bancaires natives (BIAT, STB...)", "Concurrent indirect", "Base installée, confiance", "Partiel, biaisé vers propre banque", "Moyenne"],
      ["Sites banques (comparatif)", "Concurrent indirect", "Autorité de marque", "Pas de comparaison multi-banques", "Faible"],
      ["Comparafia.com (MAR)", "Concurrent potentiel", "Modèle prouvé Maroc", "Non présent en Tunisie", "Forte si entrée"],
      ["Yomken / Expat.com", "Substitut partiel", "Communauté active", "Non spécialisé banking", "Faible"],
      ["Aucun comparateur tunisien", "Vide concurrentiel", "N/A", "N/A", "—"],
    ]
  )}

  ${h2("3.4 Tendances de Marché")}
  <ul>
    ${li("Circulaire BCT 2017-06 : obligation de transparence tarifaire pour toutes les banques")}
    ${li("Stratégie nationale d'inclusion financière 2023–2027 : objectif 65% de bancarisation")}
    ${li("Croissance du m-banking : +34%/an selon la BCT — 2,1M d'utilisateurs actifs mobiles")}
    ${li("Adoption de l'IA en Afrique du Nord : marché fintech MENA à 3,4 Mds USD d'ici 2026")}
    ${li("Génération Z et Millennials : 68% préfèrent comparer en ligne avant de choisir une banque")}
  </ul>
  ${pb()}
`;

// 4. ANALYSE SWOT
htmlContent += `
  ${sectionHeader("4", "Analyse SWOT", "Forces, Faiblesses, Opportunités et Menaces")}
  ${swotTable()}
  ${space(1)}
  ${h3("Plan d'action issu du SWOT")}
  ${fullTable(
    ["Axe SO — Exploiter", "Axe ST — Protéger", "Axe WO — Améliorer", "Axe WT — Éviter"],
    [[
      "Lancer avant tout concurrent (window of opportunity 12 mois)",
      "Signer des accords data avec banques avant réglementation restrictive",
      "Recruter un data analyst BCT dès la série A",
      "Ne pas dépendre d'un seul canal d'acquisition"
    ]]
  )}
  ${pb()}
`;

// 5. MODÈLE ÉCONOMIQUE
htmlContent += `
  ${sectionHeader("5", "Modèle Économique", "Sources de revenus, structure de coûts et pricing")}
  ${h2("5.1 Sources de Revenus")}
  ${fullTable(
    ["Stream", "Mécanisme", "Cible", "Revenue An-1 (DT)", "Revenue An-3 (DT)"],
    [
      ["Publicité native B2B", "Banques paient pour visibilité premium dans le comparateur", "23 banques TN", "45 000", "210 000"],
      ["Affiliation (leads)", "Commission par ouverture de compte / crédit accordé", "Banques partenaires", "12 000", "180 000"],
      ["Abonnement Premium (B2C)", "Fonctions avancées : alertes taux, export, historique", "PME & power users", "8 000", "145 000"],
      ["API Data B2B (SaaS)", "Accès aux données structurées pour fintechs, assureurs", "Fintechs, courtiers", "0", "220 000"],
      ["Partenariats institutionnels", "BCT, associations consommateurs, médias financiers", "Secteur public", "5 000", "135 000"],
      ["TOTAL", "", "", "70 000 DT", "890 000 DT"],
    ]
  )}

  ${h2("5.2 Structure de Coûts")}
  ${fullTable(
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
  )}

  ${h2("5.3 Pricing — Abonnements")}
  ${fullTable(
    ["Plan", "Cible", "Prix", "Fonctionnalités"],
    [
      ["Free", "Grand public", "0 DT", "Comparateur, 3 banques, alertes basiques"],
      ["Premium", "Particuliers actifs", "4,9 DT/mois", "Toutes banques, alertes taux, historique, export PDF"],
      ["Pro", "PME & entrepreneurs", "19,9 DT/mois", "Dashboard multi-comptes, API légère, rapport mensuel"],
      ["Entreprise", "Fintechs, courtiers", "Sur devis", "API complète, données brutes, SLA garanti"],
    ]
  )}
  ${pb()}
`;

// 6. BUSINESS MODEL CANVAS (Grid layout pour rendu parfait en HTML)
htmlContent += `
  ${sectionHeader("6", "Business Model Canvas (BMC)", "Vue synthétique sur 9 blocs stratégiques")}
  <div class="grid-5">
    ${bmcCell("🤝 Partenaires Clés", ["BCT (données réglementaires)", "23 banques tunisiennes", "Fintechs partenaires", "Agences digitales", "Universités & incubateurs", "AWS / Firebase (cloud)"], "1A3626", "1A3626")}
    
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div class="bmc-cell" style="background-color: #f0fdf4; flex: 1;">
        <div style="font-weight: bold; color: #fff; background: #005c3a; padding: 2px; margin-bottom: 4px;">⚙️ ACTIVITÉS</div>
        <div style="font-size: 8pt;">• Collecte data bancaire<br>• Dev & maintenance app<br>• Chatbot IA BCT<br>• Acquisition B2B</div>
      </div>
      <div class="bmc-cell" style="background-color: #f0fdf4; flex: 1;">
        <div style="font-weight: bold; color: #fff; background: #005c3a; padding: 2px; margin-bottom: 4px;">🔑 RESSOURCES</div>
        <div style="font-size: 8pt;">• Base data tarifs TN<br>• Algorithm scoring<br>• IA conversationnelle<br>• Équipe tech/prod</div>
      </div>
    </div>

    ${bmcCell("💎 Proposition de Valeur", ["Particuliers : Comparer 23 banques en 60s, droits BCT", "Banques : Visibilité qualifiée, leads convertis", "PME : Optimiser frais pro, accès crédit"], "1A5C3A", "1A5C3A")}
    
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div class="bmc-cell" style="background-color: #f0fdf4; flex: 1;">
        <div style="font-weight: bold; color: #fff; background: #005c3a; padding: 2px; margin-bottom: 4px;">💬 RELATIONS</div>
        <div style="font-size: 8pt;">• Self-service App<br>• Chatbot IA 24/7<br>• Notifs personnalisées</div>
      </div>
      <div class="bmc-cell" style="background-color: #f0fdf4; flex: 1;">
        <div style="font-weight: bold; color: #fff; background: #005c3a; padding: 2px; margin-bottom: 4px;">📣 CANAUX</div>
        <div style="font-size: 8pt;">• App Store / Google Play<br>• SEO/SEM tunisien<br>• Instagram & TikTok</div>
      </div>
    </div>

    ${bmcCell("👥 Segments Clients", ["B2C : 18-45 ans bancarisés, PME, Étudiants, Diaspora", "B2B : 23 banques, Assurances, Fintechs"], "1A3626", "1A3626")}
  </div>
  
  <div class="grid-2">
    <div style="background-color: #fef2f2; border: 1px solid #aaa; padding: 10px; font-size: 9pt;">
      <span style="font-weight: bold; color: #dc2626;">💸 STRUCTURE DE COÛTS:</span> Dev mobile (18k DT) • Masse salariale (28k DT) • Cloud (3,6k DT) • Marketing (8k DT) | Total An-1: 66 400 DT
    </div>
    <div style="background-color: #e6f7f0; border: 1px solid #aaa; padding: 10px; font-size: 9pt;">
      <span style="font-weight: bold; color: #005c3a;">💰 FLUX DE REVENUS:</span> Publicité native B2B (45k DT) • Affiliation leads (12k DT) • Abonnements Premium (8k DT) | Total An-1: 70 000 DT • An-3: 890k DT
    </div>
  </div>
  ${p("Le BMC ci-dessus synthétise la logique de valeur de Bankly...", { italic: true, color: SLATE })}
  ${pb()}
`;

// 7. STRATÉGIE MARKETING & ACQUISITION
htmlContent += `
  ${sectionHeader("7", "Stratégie Marketing & Acquisition", "Go-to-market, canaux d'acquisition et stratégie de marque")}
  ${h2("7.1 Positionnement de Marque")}
  <div class="grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
    <div style="background-color: #${GREEN_LIGHT}; padding: 12px; border-radius: 4px;">
      <b>🎨 Identité</b><br><span style="font-size: 9.5pt;">FinTech premium, de confiance. Vert émeraude + noir profond.</span>
    </div>
    <div style="background-color: #${BLUE_BG}; padding: 12px; border-radius: 4px;">
      <b>🗣️ Ton</b><br><span style="font-size: 9.5pt;">Expert mais accessible. Pédagogique pour le grand public.</span>
    </div>
    <div style="background-color: #${PURPLE_BG}; padding: 12px; border-radius: 4px;">
      <b>🏆 Position</b><br><span style="font-size: 9.5pt;">Le conseiller digital impartial — aucun lien capitalistique.</span>
    </div>
  </div>

  ${h2("7.2 Plan d'Acquisition par Canal")}
  ${fullTable(
    ["Canal", "Tactique", "Budget An-1", "KPI", "Horizon"],
    [
      ["SEO Organique", "100+ articles 'Banques en Tunisie', guides BCT", "800 DT", "5k visites/mois mois 6", "0-12 mois"],
      ["Instagram / TikTok", "Contenu éducatif : 'Droits BCT en 60s'", "1 200 DT", "10k followers mois 6", "0-6 mois"],
      ["ASO", "Mots-clés : 'banque tunisie', 'comparateur'", "0 DT", "Top 5 Finance Store TN", "0-3 mois"],
      ["Partenariats Media", "Kapitalis, L'Économiste Maghrébin", "2 000 DT", "3 articles/mois", "3-9 mois"],
      ["B2B Direct", "Cold outreach, présentation deck banques", "1 500 DT", "3 partenariats signés", "3-12 mois"],
      ["Google Ads", "Campagnes CPC : 'ouvrir compte banque'", "2 500 DT", "CPA &lt; 4 DT", "6-12 mois"],
    ]
  )}
  ${pb()}
`;

// 8. PLAN OPÉRATIONNEL & ROADMAP
htmlContent += `
  ${sectionHeader("8", "Plan Opérationnel & Roadmap Produit", "Phases de développement et jalons clés sur 36 mois")}
  ${h2("8.1 Roadmap par Phase")}
  ${fullTable(
    ["Phase", "Période", "Objectifs Produit", "Objectifs Business", "Budget"],
    [
      ["Phase 0", "M0–M3", "MVP web/mobile, 5 banques, chatbot", "Validation 100 beta users", "8 000 DT"],
      ["Phase 1", "M4–M9", "App iOS+Android, 15 banques, push", "1 000 utilisateurs actifs", "20 000 DT"],
      ["Phase 2", "M10–M18", "23 banques, IA avancée, Premium", "10 000 MAU, break-even", "45 000 DT"],
      ["Phase 3", "M19–M30", "Module assurances, app Algérie/Maroc", "50 000 MAU, Série A", "120 000 DT"],
    ]
  )}

  ${h2("8.2 Architecture Technologique")}
  ${fullTable(
    ["Couche", "Technologie", "Justification"],
    [
      ["Frontend Mobile", "React Native", "Une codebase, déploiement simultané"],
      ["Backend API", "Node.js / FastAPI", "Performance, scalabilité"],
      ["Base de Données", "PostgreSQL + Redis", "Données structurées + cache"],
      ["IA / Chatbot", "Claude API + RAG", "Précision via documents BCT"],
    ]
  )}
  ${pb()}
`;

// 9. STRUCTURE JURIDIQUE
htmlContent += `
  ${sectionHeader("9", "Structure Juridique & Organisation", "Forme légale, gouvernance et conformité")}
  ${h2("9.1 Forme Juridique Recommandée")}
  ${fullTable(
    ["Critère", "Détail"],
    [
      ["Forme recommandée", "SUARL (Société Unipersonnelle à Responsabilité Limitée)"],
      ["Capital minimum", "1 000 DT (libérable à 50% à la création)"],
      ["Label Startup Act", "Demander le label pour avantages fiscaux 8 ans"],
      ["Protection IP", "Dépôt marque BANKLY à l'INNORPI dès M0"]
    ]
  )}
  ${pb()}
`;

// 10. PLAN FINANCIER PRÉVISIONNEL
htmlContent += `
  ${sectionHeader("10", "Plan Financier Prévisionnel", "P&L, Cash-flow et scénarios de croissance sur 3 ans")}
  ${h2("10.1 Compte de Résultat Prévisionnel (en DT)")}
  ${fullTable(
    ["Poste", "Année 1", "Année 2", "Année 3"],
    [
      ["REVENUS TOTAUX", "70 000", "310 000", "890 000"],
      ["CHARGES TOTALES", "66 400", "148 000", "204 200"],
      ["RÉSULTAT D'EXPLOITATION", "+ 3 600", "+ 162 000", "+ 685 800"],
      ["MARGE NETTE", "5,1%", "52,3%", "77,1%"],
    ]
  )}
  ${pb()}
`;

// 11. STRATÉGIE DE FINANCEMENT
htmlContent += `
  ${sectionHeader("11", "Stratégie de Financement", "Sources de capital, jalons de levée et dilution")}
  <ul>
    ${li("ANME — subventions startup tech : jusqu'à 100k DT")}
    ${li("Startup Act Tunisie — exonérations fiscales 8 ans")}
    ${li("Flat6Labs Tunis — ticket 40-80k USD")}
  </ul>
  ${pb()}
`;

// 12. ANALYSE DES RISQUES
htmlContent += `
  ${sectionHeader("12", "Analyse des Risques & Mitigation", "Matrice des risques et plans de contingence")}
  ${fullTable(
    ["Risque", "Probabilité", "Impact", "Score", "Mitigation"],
    [
      ["Résistance des banques", "Élevée", "Élevé", "🔴 Critique", "Collecte manuelle + scraping"],
      ["Concurrent financé", "Moyenne", "Élevé", "🟠 Majeur", "Accélération roadmap"],
    ]
  )}
  ${pb()}
`;

// 13. KPIs
htmlContent += `
  ${sectionHeader("13", "Indicateurs de Performance (KPIs)", "Tableau de bord stratégique sur 36 mois")}
  ${h2("13.1 KPIs Produit")}
  ${fullTable(
    ["KPI", "Mois 6", "Mois 12", "Mois 24", "Mois 36"],
    [
      ["MAU", "1 000", "5 000", "25 000", "75 000"],
      ["Comparaisons/mois", "3 000", "18 000", "95 000", "280 000"],
    ]
  )}
  ${pb()}
`;

// 14. ANNEXES
htmlContent += ` 
  ${sectionHeader("14", "Annexes", "Documents complémentaires et références")}
  ${h2("Annexe C — Lexique Bancaire Tunisien")}
  ${fullTable(
    ["Terme", "Définition"],
    [
      ["BCT", "Banque Centrale de Tunisie"],
      ["TMM", "Taux du Marché Monétaire (7.99% jan. 2025)"],
    ]
  )}
  
  ${space(2)}
  <div style="text-align: center; color: #${SLATE}; font-size: 11pt; font-weight: bold;">— FIN DU DOCUMENT —</div>
  <div style="text-align: center; color: #${SLATE}; font-size: 9pt; font-style: italic;">Bankly © 2025 — Document Confidentiel</div>
</body>
</html>
`;

// Écriture du fichier final
fs.writeFileSync('/mnt/user-data/outputs/Bankly_Business_Plan_2025.html', htmlContent);
console.log('Fichier HTML généré avec succès dans /mnt/user-data/outputs/Bankly_Business_Plan_2025.html');
