/**
 * Generates two Excalidraw diagrams for the project:
 *   - docs/diagrams/er-relationships.excalidraw
 *   - docs/diagrams/information-flow.excalidraw
 *
 * Run with: pnpm diagrams:generate
 *
 * The ER diagram is driven by the actual Drizzle schemas under src/ so it
 * stays in sync whenever a schema changes. The information-flow diagram
 * is hand-authored and not schema-driven.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { users } from 'src/users/schema/users.schema';
import { equipmentTypes } from 'src/equipment-types/schema/equipment-types.schema';
import { operators } from 'src/operators/schema/operators.schema';
import { equipment } from 'src/equipment/schema/equipment.schema';
import { equipmentMaintenance } from 'src/equipment/maintenance/schema/equipment-maintenance.schema';
import { locations } from 'src/locations/schema/locations.schema';
import { missions } from 'src/missions/schema/missions.schema';

// ---------- Excalidraw element builders ----------

const NOW = Date.now();

type ExcalidrawElement = Record<string, unknown>;

function baseProps(
  id: string,
  type: string,
  extra: Record<string, unknown> = {},
): ExcalidrawElement {
  return {
    id,
    type,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    angle: 0,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 2_000_000_000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2_000_000_000),
    isDeleted: false,
    boundElements: [],
    updated: NOW,
    link: null,
    locked: false,
    ...extra,
  };
}

function rect(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  bg: string,
  opts: Partial<{ stroke: string; dashed: boolean; roundness: boolean }> = {},
): ExcalidrawElement {
  return baseProps(id, 'rectangle', {
    x,
    y,
    width,
    height,
    backgroundColor: bg,
    strokeColor: opts.stroke ?? '#1e1e1e',
    strokeStyle: opts.dashed ? 'dashed' : 'solid',
    roundness: opts.roundness === false ? null : { type: 3 },
  });
}

function text(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  content: string,
  fontSize: number,
  opts: Partial<{
    color: string;
    align: 'left' | 'center' | 'right';
    weight: 'normal' | 'bold';
  }> = {},
): ExcalidrawElement {
  return baseProps(id, 'text', {
    x,
    y,
    width,
    height,
    strokeColor: opts.color ?? '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    roughness: 0,
    text: content,
    fontSize,
    fontFamily: 1,
    textAlign: opts.align ?? 'left',
    verticalAlign: 'top',
    containerId: null,
    originalText: content,
    autoResize: true,
  });
}

function arrow(
  id: string,
  x: number,
  y: number,
  dx: number,
  dy: number,
  opts: Partial<{ color: string; dashed: boolean; label: string }> = {},
): ExcalidrawElement[] {
  const strokeColor = opts.color ?? '#1e1e1e';
  const strokeStyle = opts.dashed ? 'dashed' : 'solid';
  const baseArrow = baseProps(id, 'arrow', {
    x,
    y,
    width: Math.abs(dx),
    height: Math.abs(dy),
    points: [
      [0, 0],
      [dx, dy],
    ],
    strokeColor,
    strokeStyle,
    strokeWidth: 2,
    roughness: 0,
    roundness: { type: 2 },
    endBinding: null,
    startBinding: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
    elbowed: false,
  });
  return [baseArrow];
}

function writeDiagram(path: string, elements: ExcalidrawElement[]): void {
  const doc = {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements,
    appState: { viewBackgroundColor: '#ffffff' },
    files: {},
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
  console.log(`✓ ${path}  (${elements.length} elements)`);
}

// ---------- Diagram 1: ER Relationships ----------

// CamelCase → Module name suffix
function pascalCase(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join('');
}

function moduleName(key: string): string {
  return `${pascalCase(key)}Module`;
}

// Background color per table — grouped by domain.
const BG_COLOR: Record<string, string> = {
  users: '#a5d8ff',
  equipmentTypes: '#a5d8ff',
  operators: '#b2f2bb',
  equipment: '#ffd8a8',
  equipmentMaintenance: '#ffd8a8',
  locations: '#b2f2bb',
  missions: '#b2f2bb',
};

// Arrow color by onDelete action (matches the legend below).
const FK_COLOR: Record<string, string> = {
  cascade: '#1971c2',
  restrict: '#e8590c',
  'set null': '#2f9e44',
};

const SCHEMAS = {
  users,
  equipmentTypes,
  operators,
  equipment,
  equipmentMaintenance,
  locations,
  missions,
} as const;

type SchemaKey = keyof typeof SCHEMAS;

type ErTable = {
  key: SchemaKey;
  name: string;
  module: string;
  fields: string[];
  bg: string;
};

type FkLink = {
  from: string;
  to: string;
  label: string;
  dashed?: boolean;
  color?: string;
};

function formatField(
  col: {
    name: string;
    primary: boolean;
    isUnique: boolean;
    notNull: boolean;
  },
  fkTarget: string | null,
): string {
  const annotations: string[] = [];
  if (col.primary) annotations.push('uuid PK');
  if (col.isUnique) annotations.push('unique');
  if (fkTarget) annotations.push(`FK → ${fkTarget}`);
  let s = col.name;
  if (annotations.length > 0) s += ` (${annotations.join(', ')})`;
  if (!col.notNull) s += '?';
  return s;
}

function buildErDiagram(): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = [];
  const W = 280;
  const H = 380;

  const tables: ErTable[] = (
    Object.entries(SCHEMAS) as Array<[SchemaKey, (typeof SCHEMAS)[SchemaKey]]>
  ).map(([key, table]) => {
    const cfg = getTableConfig(table);

    const fkByColumn = new Map<string, string>();
    for (const fk of cfg.foreignKeys) {
      const ref = fk.reference();
      const fromCol = ref.columns[0]?.name;
      const toTableName = (
        ref.foreignTable as unknown as Record<symbol, string>
      )[Symbol.for('drizzle:Name')];
      if (fromCol && toTableName) fkByColumn.set(fromCol, toTableName);
    }

    const fields = cfg.columns.map((col) =>
      formatField(
        {
          name: col.name,
          primary: col.primary,
          isUnique: col.isUnique,
          notNull: col.notNull,
        },
        fkByColumn.get(col.name) ?? null,
      ),
    );

    return {
      key,
      name: cfg.name,
      module: moduleName(key),
      fields,
      bg: BG_COLOR[key] ?? '#f1f3f5',
    };
  });

  tables.sort((a, b) => a.name.localeCompare(b.name));

  const colXs = [60, 720] as const;
  const rowH = 440;
  const positions: Record<string, { x: number; y: number }> = {};
  const nameToKey: Record<string, string> = {};
  tables.forEach((t, i) => {
    positions[t.name] = {
      x: colXs[i % colXs.length]!,
      y: 40 + Math.floor(i / colXs.length) * rowH,
    };
    nameToKey[t.name] = t.key;
  });

  for (const t of tables) {
    const p = positions[t.name]!;
    const boxId = `box-${t.key}`;
    elements.push(rect(boxId, p.x, p.y, W, H, t.bg, { roundness: true }));

    const titleH = 28;
    elements.push(
      text(`title-${t.key}`, p.x + 12, p.y + 10, W - 24, titleH, t.name, 20, {
        color: '#0b3d91',
        weight: 'bold',
      }),
    );

    elements.push(
      text(
        `sub-${t.key}`,
        p.x + 12,
        p.y + 36,
        W - 24,
        18,
        `↳ ${t.module}`,
        12,
        {
          color: '#5c7c91',
        },
      ),
    );

    elements.push(
      baseProps(`div-${t.key}`, 'line', {
        x: p.x + 10,
        y: p.y + 58,
        width: W - 20,
        height: 0,
        points: [
          [0, 0],
          [W - 20, 0],
        ],
        strokeColor: '#0b3d91',
        strokeWidth: 1,
        roughness: 0,
        roundness: { type: 2 },
      }),
    );

    const fieldsY = p.y + 68;
    const lineH = 18;
    t.fields.forEach((f, i) => {
      elements.push(
        text(
          `field-${t.key}-${i}`,
          p.x + 14,
          fieldsY + i * lineH,
          W - 24,
          lineH,
          f,
          13,
        ),
      );
    });
  }

  const links: FkLink[] = [];
  for (const table of Object.values(SCHEMAS)) {
    const cfg = getTableConfig(table);
    const fromTableName = cfg.name;
    for (const fk of cfg.foreignKeys) {
      const ref = fk.reference();
      const fromColName = ref.columns[0]?.name;
      const fromColInstance = ref.columns[0];
      const toTableName = (
        ref.foreignTable as unknown as Record<symbol, string>
      )[Symbol.for('drizzle:Name')];
      if (!fromColName || !toTableName || !fromColInstance) continue;
      const action = fk.onDelete ?? 'no action';
      const nullable = !fromColInstance.notNull;
      links.push({
        from: fromTableName,
        to: toTableName,
        label: `${fromColName}${nullable ? '?' : ''}  →  ${action}`,
        dashed: nullable,
        color: FK_COLOR[action],
      });
    }
  }

  for (const lk of links) {
    const from = positions[lk.from]!;
    const to = positions[lk.to]!;
    const fx = from.x + W / 2;
    const fy = from.y + H / 2;
    const tx = to.x + W / 2;
    const ty = to.y + H / 2;
    const dx = tx - fx;
    const dy = ty - fy;
    const fromKey = nameToKey[lk.from] ?? lk.from;
    const toKey = nameToKey[lk.to] ?? lk.to;
    const id = `arr-${fromKey}-${toKey}`;
    elements.push(
      ...arrow(id, fx, fy, dx, dy, { color: lk.color, dashed: lk.dashed }),
    );
    elements.push(
      text(
        `lbl-${fromKey}-${toKey}`,
        fx + dx * 0.35 - 90,
        fy + dy * 0.35 - 10,
        220,
        18,
        lk.label,
        12,
        {
          color: lk.color ?? '#1e1e1e',
          align: 'center',
        },
      ),
    );
  }

  const legX = 1040;
  const legY = 540;
  const legW = 280;
  const legH = 220;
  elements.push(
    rect('legend', legX, legY, legW, legH, '#f1f3f5', { roundness: true }),
  );
  elements.push(
    text(
      'legend-title',
      legX + 12,
      legY + 10,
      legW - 24,
      22,
      'Leyenda — onDelete',
      16,
      { color: '#0b3d91' },
    ),
  );
  const legendItems: Array<{ color: string; text: string; dashed?: boolean }> =
    [
      { color: '#1971c2', text: 'cascade — borra hijos' },
      { color: '#e8590c', text: 'restrict — bloquea borrado' },
      { color: '#2f9e44', text: 'set null — limpia FK (dashed = opcional)' },
    ];
  legendItems.forEach((it, i) => {
    const yy = legY + 42 + i * 28;
    elements.push(
      ...arrow(`leg-arr-${i}`, legX + 16, yy + 8, 40, 0, {
        color: it.color,
        dashed: it.dashed,
      }),
    );
    elements.push(
      text(`leg-txt-${i}`, legX + 64, yy, legW - 80, 20, it.text, 13),
    );
  });

  const groupLegY = legY + legH + 24;
  const groupLegH = 140;
  elements.push(
    rect('group-legend', legX, groupLegY, legW, groupLegH, '#f1f3f5', {
      roundness: true,
    }),
  );
  elements.push(
    text(
      'group-legend-title',
      legX + 12,
      groupLegY + 10,
      legW - 24,
      22,
      'Color por módulo',
      16,
      { color: '#0b3d91' },
    ),
  );
  const groupItems: Array<{ bg: string; text: string }> = [
    { bg: '#a5d8ff', text: 'Auth-adjunto (users, types)' },
    { bg: '#b2f2bb', text: 'Catálogo / misiones' },
    { bg: '#ffd8a8', text: 'Equipment (core)' },
  ];
  groupItems.forEach((it, i) => {
    const yy = groupLegY + 42 + i * 28;
    elements.push(
      rect(`grp-sw-${i}`, legX + 16, yy, 40, 18, it.bg, { roundness: false }),
    );
    elements.push(
      text(`grp-txt-${i}`, legX + 64, yy, legW - 80, 20, it.text, 13),
    );
  });

  return elements;
}

// ---------- Diagram 2: Information Flow ----------

function buildFlowDiagram(): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = [];
  const W = 280;
  const H = 80;
  const gapY = 60;
  const startX = 360;
  const startY = 40;

  type Step = {
    title: string;
    note: string;
    bg: string;
    stroke?: string;
  };

  const steps: Step[] = [
    {
      title: '1. Client',
      note: 'HTTP request (JSON body + Bearer token)',
      bg: '#a5d8ff',
    },
    {
      title: '2. Express middleware',
      note: 'Body parsing (JSON), CORS, Helmet',
      bg: '#a5d8ff',
    },
    {
      title: '3. JwtAuthGuard (global)',
      note: 'Verifica Bearer token → req.user',
      bg: '#a5d8ff',
    },
    {
      title: '4. RolesGuard (global)',
      note: 'Si @Roles, valida role del usuario',
      bg: '#a5d8ff',
    },
    {
      title: '5. ValidationPipe (global)',
      note: 'class-validator + class-transformer (whitelist + forbidNonWhitelisted)',
      bg: '#b2f2bb',
    },
    {
      title: '6. Controller',
      note: 'Mapea ruta HTTP → service method; aplica DTOs',
      bg: '#b2f2bb',
    },
    {
      title: '7. Service',
      note: 'Lógica de negocio envuelta en tryCatch',
      bg: '#b2f2bb',
    },
    {
      title: '8. Drizzle Repository',
      note: 'SQL parametrizado vía Drizzle ORM',
      bg: '#ffd8a8',
    },
    {
      title: '9. PostgreSQL',
      note: 'Ejecuta query; retorna filas o error de constraint',
      bg: '#ffd8a8',
    },
    {
      title: '10. Response',
      note: 'JSON body + status (200/201/400/401/403/404/409/500)',
      bg: '#d0ebff',
    },
  ];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]!;
    const y = startY + i * (H + gapY);
    elements.push(
      rect(`step-${i}`, startX, y, W, H, s.bg, { roundness: true }),
    );
    elements.push(
      text(`step-title-${i}`, startX + 12, y + 8, W - 24, 24, s.title, 16, {
        color: '#0b3d91',
      }),
    );
    elements.push(
      text(`step-note-${i}`, startX + 12, y + 36, W - 24, 36, s.note, 12),
    );
  }

  for (let i = 0; i < steps.length - 1; i++) {
    const y = startY + (i + 1) * H + i * gapY;
    elements.push(
      ...arrow(`flow-arr-${i}`, startX + W / 2, y, 0, gapY, {
        color: '#495057',
      }),
    );
  }

  const errX = 80;
  const errY = startY + 4 * (H + gapY) + 20;
  const errW = 240;
  const errH = 200;
  elements.push(
    rect('err-filter', errX, errY, errW, errH, '#ffc9c9', { roundness: true }),
  );
  elements.push(
    text(
      'err-title',
      errX + 12,
      errY + 10,
      errW - 24,
      24,
      '11. GlobalExceptionFilter',
      16,
      { color: '#c92a2a' },
    ),
  );
  elements.push(
    text(
      'err-note',
      errX + 12,
      errY + 40,
      errW - 24,
      errH - 50,
      'Traduce excepciones a JSON con errorId (UUID v4).\n\nMapea:\n  23505 → 409\n  23503/23502/23514 → 400\n  Default → 500',
      12,
    ),
  );

  const ctrlX = startX;
  const ctrlY = startY + 5 * (H + gapY) + H / 2;
  elements.push(
    ...arrow(
      'err-arr-ctrl',
      ctrlX,
      ctrlY,
      -(ctrlX - errX - errW),
      errY + 20 - ctrlY,
      { color: '#c92a2a', dashed: true },
    ),
  );
  elements.push(
    text(
      'err-lbl-ctrl',
      ctrlX - 220,
      ctrlY - 30,
      200,
      18,
      'cualquier capa puede lanzar',
      11,
      { color: '#c92a2a' },
    ),
  );

  const respX = startX + W / 2;
  const respY = startY + 9 * (H + gapY);
  elements.push(
    ...arrow(
      'err-arr-resp',
      errX + errW,
      errY + errH / 2,
      respX - (errX + errW),
      respY - (errY + errH / 2),
      { color: '#c92a2a', dashed: true },
    ),
  );

  const legX = 80;
  const legY = startY + 10 * (H + gapY) + 40;
  const legW = 880;
  const legH = 70;
  elements.push(
    rect('flow-legend', legX, legY, legW, legH, '#f1f3f5', { roundness: true }),
  );
  elements.push(
    text(
      'flow-legend-title',
      legX + 12,
      legY + 8,
      legW - 24,
      22,
      'Leyenda de colores',
      14,
      { color: '#0b3d91' },
    ),
  );
  const legend: Array<{ color: string; text: string }> = [
    { color: '#a5d8ff', text: 'HTTP / Auth' },
    { color: '#b2f2bb', text: 'Validación / Negocio' },
    { color: '#ffd8a8', text: 'Capa de datos' },
    { color: '#ffc9c9', text: 'Manejo de errores' },
  ];
  legend.forEach((it, i) => {
    const xx = legX + 16 + i * 210;
    const yy = legY + 36;
    elements.push(
      rect(`flow-leg-sw-${i}`, xx, yy, 24, 16, it.color, { roundness: false }),
    );
    elements.push(
      text(`flow-leg-txt-${i}`, xx + 32, yy - 2, 180, 20, it.text, 13),
    );
  });

  return elements;
}

// ---------- Main ----------

const ROOT = resolve(__dirname, '..');

const erElements = buildErDiagram();
writeDiagram(
  resolve(ROOT, 'docs/diagrams/er-relationships.excalidraw'),
  erElements,
);

const flowElements = buildFlowDiagram();
writeDiagram(
  resolve(ROOT, 'docs/diagrams/information-flow.excalidraw'),
  flowElements,
);

console.log(
  '\nDone. Open the .excalidraw files in Obsidian or excalidraw.com.',
);
