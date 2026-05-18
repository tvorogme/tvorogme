export type WindowTile = {
  readonly col: number;
  readonly row: number;
  readonly colSpan: number;
  readonly rowSpan: number;
};

export type WindowConstraints = {
  readonly minColSpan: number;
  readonly minRowSpan: number;
};

export type WindowState = {
  readonly activeId: string | null;
  readonly gap: number;
  readonly layers: Record<string, number>;
  readonly layouts: Record<string, WindowTile>;
  readonly nextLayer: number;
};

export type ResizeEdge = "e" | "s" | "se";

export type InteractionStatus = {
  readonly id: string;
  readonly kind: "move" | "resize";
};

export type InteractionState = InteractionStatus & {
  readonly edge?: ResizeEdge;
  readonly pointerX: number;
  readonly pointerY: number;
  readonly stageHeight: number;
  readonly stageWidth: number;
  readonly startTile: WindowTile;
};

export const DEFAULT_GAP = 16;
export const GRID_COLUMNS = 24;
export const GRID_ROWS = 12;
export const GRID_SUBDIVISIONS = 4;
export const DENSE_GRID_COLUMNS = GRID_COLUMNS * GRID_SUBDIVISIONS;
export const DENSE_GRID_ROWS = GRID_ROWS * GRID_SUBDIVISIONS;
export const DEFAULT_CONSTRAINTS: WindowConstraints = {
  minColSpan: 2,
  minRowSpan: 2,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snapToGrid(value: number) {
  return Math.round(value * GRID_SUBDIVISIONS) / GRID_SUBDIVISIONS;
}

export function getDenseGridLine(value: number) {
  return Math.round((value - 1) * GRID_SUBDIVISIONS) + 1;
}

export function getDenseGridSpan(value: number) {
  return Math.max(1, Math.round(value * GRID_SUBDIVISIONS));
}

export function normalizeConstraints(
  constraints: WindowConstraints,
): WindowConstraints {
  return {
    minColSpan: clamp(Math.round(constraints.minColSpan), 1, GRID_COLUMNS),
    minRowSpan: clamp(Math.round(constraints.minRowSpan), 1, GRID_ROWS),
  };
}

export function normalizeTile(
  tile: WindowTile,
  constraints = DEFAULT_CONSTRAINTS,
): WindowTile {
  const normalizedConstraints = normalizeConstraints(constraints);
  const colSpan = clamp(
    snapToGrid(tile.colSpan),
    normalizedConstraints.minColSpan,
    GRID_COLUMNS,
  );
  const rowSpan = clamp(
    snapToGrid(tile.rowSpan),
    normalizedConstraints.minRowSpan,
    GRID_ROWS,
  );

  return {
    col: clamp(snapToGrid(tile.col), 1, GRID_COLUMNS - colSpan + 1),
    row: clamp(snapToGrid(tile.row), 1, GRID_ROWS - rowSpan + 1),
    colSpan,
    rowSpan,
  };
}

export function tilesEqual(first: WindowTile, second: WindowTile) {
  return (
    first.col === second.col &&
    first.row === second.row &&
    first.colSpan === second.colSpan &&
    first.rowSpan === second.rowSpan
  );
}

export function getInteractionTile(
  interaction: InteractionState,
  nextPointer: { readonly x: number; readonly y: number },
  constraints: WindowConstraints,
) {
  const deltaColumns = snapToGrid(
    ((nextPointer.x - interaction.pointerX) / interaction.stageWidth) *
      GRID_COLUMNS,
  );
  const deltaRows = snapToGrid(
    ((nextPointer.y - interaction.pointerY) / interaction.stageHeight) *
      GRID_ROWS,
  );

  if (interaction.kind === "move") {
    return normalizeTile(
      {
        ...interaction.startTile,
        col: interaction.startTile.col + deltaColumns,
        row: interaction.startTile.row + deltaRows,
      },
      constraints,
    );
  }

  const shouldResizeColumns =
    interaction.edge === "e" || interaction.edge === "se";
  const shouldResizeRows =
    interaction.edge === "s" || interaction.edge === "se";

  return normalizeTile(
    {
      ...interaction.startTile,
      colSpan:
        interaction.startTile.colSpan +
        (shouldResizeColumns ? deltaColumns : 0),
      rowSpan:
        interaction.startTile.rowSpan + (shouldResizeRows ? deltaRows : 0),
    },
    constraints,
  );
}
