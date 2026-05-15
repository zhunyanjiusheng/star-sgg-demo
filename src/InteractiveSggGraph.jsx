import React, { useMemo, useState } from "react";

const COLORS = {
  taxiway: "#CFE1F9",
  runway: "#D7B3E8",
  apron: "#CFEECF",
  airplane: "#F4DA76",
  boarding_bridge: "#F8D9A6",
  tank: "#F6C1C1",
  terminal: "#E5E5E5",
};

const DEFAULT_POS = {
  tank: { x: 120, y: 90 },
  taxiway: { x: 150, y: 300 },
  apron: { x: 280, y: 470 },
  boarding_bridge: { x: 480, y: 150 },
  airplane: { x: 770, y: 310 },
  runway: { x: 590, y: 520 },
  terminal: { x: 690, y: 80 },
};

function normalizeGraph(graph) {
  const nodes = new Map();
  const edges = [];

  const objects = graph?.objects || graph?.nodes || [];
  const relations = graph?.relations || graph?.edges || [];

  for (const obj of objects) {
    const id = typeof obj === "string" ? obj : obj.id || obj.name || obj.label;
    if (!id) continue;

    nodes.set(id, {
      id,
      label: id,
      count: typeof obj === "string" ? 1 : obj.count ?? obj.number ?? 1,
    });
  }

  for (const rel of relations) {
    let source;
    let target;
    let label;

    if (Array.isArray(rel)) {
      source = rel[0];
      label = rel[1];
      target = rel[2];
    } else {
      source = rel.source || rel.subject || rel.from || rel.subj;
      target = rel.target || rel.object || rel.to || rel.obj;
      label = rel.relation || rel.predicate || rel.label || rel.pred;
    }

    if (!source || !target || !label) continue;

    if (!nodes.has(source)) {
      nodes.set(source, { id: source, label: source, count: 1 });
    }

    if (!nodes.has(target)) {
      nodes.set(target, { id: target, label: target, count: 1 });
    }

    edges.push({
      id: `${source}-${label}-${target}-${edges.length}`,
      source,
      target,
      label,
    });
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}

function getNodeRadius(node) {
  const text = `${node.label} (${node.count})`;
  return Math.max(48, 28 + text.length * 2.4);
}

function shortenLine(source, target, r1, r2) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  return {
    start: {
      x: source.x + (dx / len) * r1,
      y: source.y + (dy / len) * r1,
    },
    end: {
      x: target.x - (dx / len) * r2,
      y: target.y - (dy / len) * r2,
    },
  };
}

function quadraticPoint(p0, p1, p2, t) {
  return {
    x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
    y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
  };
}

function quadraticAngle(p0, p1, p2, t) {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);

  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;

  return angle;
}

function shortenLabel(label) {
  const map = {
    "parking in the same apron with": "same apron with",
    "parallelly parked on": "parallel parked on",
    "within same line of": "same line as",
  };

  return map[label] || label;
}

export default function InteractiveSggGraph({ graph }) {
  const normalized = useMemo(() => normalizeGraph(graph), [graph]);

  const [nodes, setNodes] = useState(() => {
    const result = {};

    normalized.nodes.forEach((node, index) => {
      const p = DEFAULT_POS[node.id] || {
        x: 180 + (index % 4) * 180,
        y: 120 + Math.floor(index / 4) * 150,
      };

      result[node.id] = {
        ...node,
        x: p.x,
        y: p.y,
      };
    });

    return result;
  });

  const [controls, setControls] = useState({});
  const [drag, setDrag] = useState(null);

  const width = 900;
  const height = 620;

  const getSvgPoint = (evt) => {
    const svg = evt.currentTarget.ownerSVGElement || evt.currentTarget;
    const rect = svg.getBoundingClientRect();

    return {
      x: ((evt.clientX - rect.left) / rect.width) * width,
      y: ((evt.clientY - rect.top) / rect.height) * height,
    };
  };

  const onMouseMove = (evt) => {
    if (!drag) return;

    const p = getSvgPoint(evt);

    if (drag.type === "node") {
      setNodes((prev) => ({
        ...prev,
        [drag.id]: {
          ...prev[drag.id],
          x: p.x,
          y: p.y,
        },
      }));
    }

    if (drag.type === "edge") {
      setControls((prev) => ({
        ...prev,
        [drag.id]: p,
      }));
    }
  };

  const onMouseUp = () => {
    setDrag(null);
  };

  return (
    <div className="h-full w-full rounded-[28px] bg-white">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#333" />
          </marker>
        </defs>

        {normalized.edges.map((edge, index) => {
          const s = nodes[edge.source];
          const t = nodes[edge.target];

          if (!s || !t) return null;

          const r1 = getNodeRadius(s);
          const r2 = getNodeRadius(t);

          let start;
          let end;
          let control;

          if (edge.source === edge.target) {
            start = { x: s.x - 24, y: s.y - r1 + 12 };
            end = { x: s.x + 24, y: s.y - r1 + 12 };
            control = controls[edge.id] || { x: s.x, y: s.y - r1 - 70 };
          } else {
            const shortened = shortenLine(s, t, r1, r2);
            start = shortened.start;
            end = shortened.end;

            const mid = {
              x: (start.x + end.x) / 2,
              y: (start.y + end.y) / 2,
            };

            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;

            const nx = -dy / len;
            const ny = dx / len;

            const offset = ((index % 5) - 2) * 30;

            control =
              controls[edge.id] || {
                x: mid.x + nx * offset,
                y: mid.y + ny * offset,
              };
          }

          const path = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
          const labelPoint = quadraticPoint(start, control, end, 0.5);
          const angle = quadraticAngle(start, control, end, 0.5);
          const label = shortenLabel(edge.label);

          return (
            <g key={edge.id}>
              <path
                d={path}
                fill="none"
                stroke="#333"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />

              <circle
                cx={control.x}
                cy={control.y}
                r="7"
                fill="#38bdf8"
                opacity="0.2"
                className="cursor-grab"
                onMouseDown={(evt) => {
                  evt.stopPropagation();
                  setDrag({ type: "edge", id: edge.id });
                }}
              />

              <g transform={`translate(${labelPoint.x}, ${labelPoint.y}) rotate(${angle})`}>
                <rect
                  x={-label.length * 3.7 - 7}
                  y={-12}
                  width={label.length * 7.4 + 14}
                  height={24}
                  rx={6}
                  fill="white"
                  opacity="0.72"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fill="#222"
                  className="select-none"
                >
                  {label}
                </text>
              </g>
            </g>
          );
        })}

        {Object.values(nodes).map((node) => {
          const r = getNodeRadius(node);
          const color = COLORS[node.id] || "#ddd";

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-grab"
              onMouseDown={(evt) => {
                evt.stopPropagation();
                setDrag({ type: "node", id: node.id });
              }}
            >
              <circle r={r} fill={color} stroke="#333" strokeWidth="2" />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="15"
                fontWeight="700"
                fill="#222"
                className="select-none"
              >
                {node.label}
              </text>
              <text
                y="20"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="700"
                fill="#222"
                className="select-none"
              >
                ({node.count})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
