import React, { useEffect, useRef } from 'react';

// ── STATIC DATA ───────────────────────────────────────────────
const NODE_DATA = [
  { id: 'flu',         label: 'Influenza',        type: 'disease' },
  { id: 'viral',       label: 'Viral Syndrome',   type: 'disease' },
  { id: 'migraine',    label: 'Migraine',         type: 'disease' },
  { id: 'pneumonia',   label: 'Pneumonia',        type: 'disease' },
  { id: 'anemia',      label: 'Anemia',           type: 'disease' },
  { id: 'hyper',       label: 'Hypertension',     type: 'disease' },
  { id: 'dehydr',      label: 'Dehydration',      type: 'disease' },
  { id: 'dengue',      label: 'Dengue Fever',     type: 'disease' },
  { id: 'typhoid',     label: 'Typhoid',          type: 'disease' },
  { id: 'covid',       label: 'COVID-19',         type: 'disease' },
  { id: 'fever',       label: 'Fever',            type: 'symptom' },
  { id: 'headache',    label: 'Headache',         type: 'symptom' },
  { id: 'fatigue',     label: 'Fatigue',          type: 'symptom' },
  { id: 'cough',       label: 'Cough',            type: 'symptom' },
  { id: 'chestpain',   label: 'Chest pain',       type: 'symptom' },
  { id: 'nausea',      label: 'Nausea',           type: 'symptom' },
  { id: 'dizziness',   label: 'Dizziness',        type: 'symptom' },
  { id: 'sob',         label: 'Breathlessness',   type: 'symptom' },
  { id: 'pallor',      label: 'Pallor',           type: 'symptom' },
  { id: 'palpitation', label: 'Palpitations',     type: 'symptom' },
  { id: 'thirst',      label: 'Thirst',           type: 'symptom' },
  { id: 'rash',        label: 'Rash',             type: 'symptom' },
  { id: 'joinpain',    label: 'Joint pain',       type: 'symptom' },
  { id: 'vomit',       label: 'Vomiting',         type: 'symptom' },
  { id: 'appetite',    label: 'Loss of appetite', type: 'symptom' },
  { id: 'pt1',         label: 'Sarah K.',         type: 'patient' },
  { id: 'pt2',         label: 'Rahul M.',         type: 'patient' },
  { id: 'pt3',         label: 'Priya D.',         type: 'patient' },
];

const EDGE_DATA = [
  { s: 'flu', t: 'fever' }, { s: 'flu', t: 'fatigue' }, { s: 'flu', t: 'cough' }, { s: 'flu', t: 'headache' }, { s: 'flu', t: 'nausea' },
  { s: 'viral', t: 'fever' }, { s: 'viral', t: 'fatigue' }, { s: 'viral', t: 'headache' }, { s: 'viral', t: 'nausea' }, { s: 'viral', t: 'appetite' },
  { s: 'migraine', t: 'headache' }, { s: 'migraine', t: 'nausea' }, { s: 'migraine', t: 'dizziness' }, { s: 'migraine', t: 'vomit' },
  { s: 'pneumonia', t: 'cough' }, { s: 'pneumonia', t: 'fever' }, { s: 'pneumonia', t: 'chestpain' }, { s: 'pneumonia', t: 'sob' }, { s: 'pneumonia', t: 'fatigue' },
  { s: 'anemia', t: 'fatigue' }, { s: 'anemia', t: 'pallor' }, { s: 'anemia', t: 'palpitation' }, { s: 'anemia', t: 'dizziness' }, { s: 'anemia', t: 'sob' },
  { s: 'hyper', t: 'headache' }, { s: 'hyper', t: 'dizziness' }, { s: 'hyper', t: 'palpitation' },
  { s: 'dehydr', t: 'thirst' }, { s: 'dehydr', t: 'dizziness' }, { s: 'dehydr', t: 'fatigue' }, { s: 'dehydr', t: 'headache' },
  { s: 'dengue', t: 'fever' }, { s: 'dengue', t: 'rash' }, { s: 'dengue', t: 'joinpain' }, { s: 'dengue', t: 'headache' }, { s: 'dengue', t: 'fatigue' },
  { s: 'typhoid', t: 'fever' }, { s: 'typhoid', t: 'appetite' }, { s: 'typhoid', t: 'nausea' }, { s: 'typhoid', t: 'fatigue' }, { s: 'typhoid', t: 'vomit' },
  { s: 'covid', t: 'fever' }, { s: 'covid', t: 'cough' }, { s: 'covid', t: 'fatigue' }, { s: 'covid', t: 'sob' }, { s: 'covid', t: 'headache' },
  { s: 'pt1', t: 'fever' }, { s: 'pt1', t: 'headache' }, { s: 'pt1', t: 'fatigue' },
  { s: 'pt1', t: 'viral', strength: 0.9 }, { s: 'pt1', t: 'flu', strength: 0.6 }, { s: 'pt1', t: 'dehydr', strength: 0.55 },
  { s: 'pt2', t: 'cough' }, { s: 'pt2', t: 'sob' }, { s: 'pt2', t: 'fever' },
  { s: 'pt2', t: 'pneumonia', strength: 0.85 }, { s: 'pt2', t: 'covid', strength: 0.7 },
  { s: 'pt3', t: 'headache' }, { s: 'pt3', t: 'dizziness' }, { s: 'pt3', t: 'palpitation' },
  { s: 'pt3', t: 'hyper', strength: 0.8 }, { s: 'pt3', t: 'anemia', strength: 0.65 },
];

const POSITIONS = {
  flu: [0.12, 0.28], viral: [0.28, 0.16], migraine: [0.72, 0.14], pneumonia: [0.08, 0.54],
  anemia: [0.38, 0.62], hyper: [0.68, 0.58], dehydr: [0.88, 0.28], dengue: [0.5, 0.1],
  typhoid: [0.18, 0.72], covid: [0.82, 0.48],
  fever: [0.32, 0.32], headache: [0.52, 0.24], fatigue: [0.22, 0.44], cough: [0.14, 0.38],
  chestpain: [0.06, 0.64], nausea: [0.42, 0.46], dizziness: [0.62, 0.36], sob: [0.24, 0.62],
  pallor: [0.46, 0.72], palpitation: [0.60, 0.70], thirst: [0.80, 0.40], rash: [0.64, 0.18],
  joinpain: [0.76, 0.26], vomit: [0.56, 0.54], appetite: [0.36, 0.78],
  pt1: [0.38, 0.86], pt2: [0.58, 0.88], pt3: [0.20, 0.86],
};

function nodeColor(type) {
  return type === 'disease' ? '#a78bfa' : type === 'symptom' ? '#fb923c' : '#00d4aa';
}
function nodeRgb(type) {
  return type === 'disease' ? '167,139,250' : type === 'symptom' ? '251,146,60' : '0,212,170';
}

// ── COMPONENT ─────────────────────────────────────────────────
export default function GraphCanvas() {
  const canvasRef   = useRef(null);
  const tooltipRef  = useRef(null);
  const ttTypeRef   = useRef(null);
  const ttNameRef   = useRef(null);
  const ttConnRef   = useRef(null);

  // Shared mutable state between effect and event handlers via refs
  const hoveredRef  = useRef(null);   // currently hovered node
  const nodesRef    = useRef([]);     // live node objects (mutated by animation)
  const edgesRef    = useRef([]);     // live edge objects (mutated by animation)
  const rafRef      = useRef(null);   // current rAF id for cancellation

  // ── MOUSE EVENTS (outside effect so they can be JSX props) ──
  const handleMouseMove = (e) => {
    const mx = e.clientX, my = e.clientY;
    const hit = nodesRef.current.find(n => Math.hypot(n.x - mx, n.y - my) <= n.r + 10) || null;
    hoveredRef.current = hit;
    if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'pointer' : 'default';

    const tt = tooltipRef.current;
    if (!tt) return;
    if (hit) {
      const connCount = edgesRef.current.filter(ed => ed.s === hit.id || ed.t === hit.id).length;
      ttTypeRef.current.textContent = hit.type === 'disease' ? 'Disease node' : hit.type === 'symptom' ? 'Symptom node' : 'Patient node';
      ttTypeRef.current.style.color = nodeColor(hit.type);
      ttNameRef.current.textContent = hit.label;
      ttConnRef.current.textContent = `${connCount} connection${connCount !== 1 ? 's' : ''}`;
      let lx = mx + 16, ly = my - 56;
      if (lx + 180 > window.innerWidth) lx = mx - 184;
      if (ly < 0) ly = my + 14;
      tt.style.left = lx + 'px';
      tt.style.top  = ly + 'px';
      tt.style.opacity = '1';
    } else {
      tt.style.opacity = '0';
    }
  };

  const handleMouseLeave = () => {
    hoveredRef.current = null;
    if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
  };

  // ── SINGLE ANIMATION EFFECT ───────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    // Initialise mutable node + edge objects
    const nodes = NODE_DATA.map(n => ({
      ...n,
      x: 0, y: 0, baseX: 0, baseY: 0,
      r:         n.type === 'patient' ? 14 : n.type === 'disease' ? 11 : 8,
      glowPhase: Math.random() * Math.PI * 2,
    }));

    const edges = EDGE_DATA.map(e => ({
      ...e,
      pulse:      Math.random(),
      pulseSpeed: 0.004 + Math.random() * 0.004,
    }));

    // Expose to mouse handlers via refs
    nodesRef.current = nodes;
    edgesRef.current = edges;

    // Fast id → node lookup
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // ── Viewport size + node placement ──────────────────────
    let W = 0, H = 0;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      nodes.forEach(n => {
        const pos = POSITIONS[n.id];
        if (!pos) return;
        n.baseX = pos[0] * W;
        n.baseY = pos[1] * H;
        // Snap to base position on first resize only
        if (n.x === 0 && n.y === 0) { n.x = n.baseX; n.y = n.baseY; }
      });
    }

    // ── Traversal animation ──────────────────────────────────
    let traversalActive = false;
    let traversalEdges  = [];
    let traversalQueue  = [];

    function triggerTraversal() {
      if (traversalActive) return;
      traversalActive = true;
      traversalEdges  = [];
      traversalQueue  = [];

      const pts   = nodes.filter(n => n.type === 'patient');
      const start = pts[Math.floor(Math.random() * pts.length)];

      // Layer 1: from patient to direct neighbours
      const l1 = edges.filter(e => e.s === start.id || e.t === start.id);
      l1.forEach((e, i) => traversalQueue.push({ edge: e, delay: i * 80 }));

      // Layer 2: from neighbours outward
      const t2 = setTimeout(() => {
        const visited = new Set(l1.map(e => (e.s === start.id ? e.t : e.s)));
        visited.forEach(id => {
          const hops = edges.filter(
            e => (e.s === id || e.t === id) && e.s !== start.id && e.t !== start.id
          );
          hops.forEach((e, i) => {
            if (!traversalEdges.includes(e)) traversalQueue.push({ edge: e, delay: i * 50 });
          });
        });
      }, 800);

      const t4 = setTimeout(() => {
        traversalActive = false;
        traversalEdges  = [];
      }, 4500);

      // Return cleanup for outer scope
      return () => { clearTimeout(t2); clearTimeout(t4); };
    }

    // ── Main render loop ─────────────────────────────────────
    function animate() {
      ctx.clearRect(0, 0, W, H);

      // Float nodes gently
      nodes.forEach(n => {
        n.glowPhase += 0.012;
        n.x += Math.sin(n.glowPhase * 0.3)  * 0.12;
        n.y += Math.cos(n.glowPhase * 0.25) * 0.10;
      });

      // Advance edge pulses
      edges.forEach(e => { e.pulse = (e.pulse + e.pulseSpeed) % 1; });

      // Process traversal queue
      traversalQueue.forEach(item => { item.delay -= 16; });
      traversalQueue.forEach(item => {
        if (item.delay <= 0 && !traversalEdges.includes(item.edge)) {
          traversalEdges.push(item.edge);
        }
      });
      traversalQueue = traversalQueue.filter(
        item => item.delay > 0 || traversalEdges.includes(item.edge)
      );

      const hov = hoveredRef.current;

      // ── Draw edges ────────────────────────────────────────
      edges.forEach(e => {
        const s = nodeMap[e.s], t = nodeMap[e.t];
        if (!s || !t) return;
        const isHovConn  = hov && (e.s === hov.id || e.t === hov.id);
        const isTraverse = traversalEdges.includes(e);

        if (isHovConn) {
          const rgb = nodeRgb(s.type);
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = `rgba(${rgb},0.55)`; ctx.lineWidth = 1.4; ctx.stroke();
          const px = s.x + (t.x - s.x) * e.pulse;
          const py = s.y + (t.y - s.y) * e.pulse;
          ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},1)`; ctx.fill();
        } else if (isTraverse) {
          const rgb = nodeRgb(s.type);
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = `rgba(${rgb},0.3)`; ctx.lineWidth = 0.9; ctx.stroke();
          const px = s.x + (t.x - s.x) * e.pulse;
          const py = s.y + (t.y - s.y) * e.pulse;
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},0.8)`; ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = hov ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.055)';
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      });

      // ── Draw nodes ────────────────────────────────────────
      nodes.forEach(n => {
        const isHov  = hov && hov.id === n.id;
        const connSet = new Set();
        if (hov) edges.forEach(ed => {
          if (ed.s === hov.id) connSet.add(ed.t);
          if (ed.t === hov.id) connSet.add(ed.s);
        });
        const isConn   = connSet.has(n.id);
        const isDimmed = !!(hov && !isHov && !isConn);
        const rgb      = nodeRgb(n.type);
        const r        = n.r + (isHov ? 4 : 0);
        const glow     = 0.5 + 0.5 * Math.sin(n.glowPhase);

        if (!isDimmed) {
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb},${(isHov ? 0.25 : 0.06) * glow})`;
          ctx.lineWidth   = isHov ? 3 : 1.5; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${isDimmed ? 0.06 : 0.12})`; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb},${isDimmed ? 0.15 : isHov ? 0.95 : 0.55})`;
        ctx.lineWidth   = isHov ? 1.8 : 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${isDimmed ? 0.1 : isHov ? 0.9 : 0.5})`; ctx.fill();

        if (n.type === 'patient' && !isDimmed) {
          const pr = r + 14 + glow * 6;
          ctx.beginPath(); ctx.arc(n.x, n.y, pr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb},${0.08 * glow})`; ctx.lineWidth = 1; ctx.stroke();
        }
        if (isHov || isConn) {
          ctx.font         = `${isHov ? '600' : '400'} 11px 'Space Grotesk', sans-serif`;
          ctx.textAlign    = 'center'; ctx.textBaseline = 'top';
          ctx.fillStyle    = `rgba(${rgb},${isHov ? 1 : 0.7})`;
          ctx.fillText(n.label, n.x, n.y + r + 5);
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    // ── Boot ─────────────────────────────────────────────────
    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(animate);

    // First traversal fires after 600 ms (matches original HTML)
    const t0 = setTimeout(triggerTraversal, 600);
    const interval = setInterval(triggerTraversal, 5500);

    // ── Cleanup on unmount ───────────────────────────────────
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, []); // ← runs ONCE on mount only

  // ── RENDER ───────────────────────────────────────────────
  return (
    <>
      {/* Full-viewport fixed canvas — stays behind all hero content */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '100%',
          height:        '100%',
          zIndex:        1,
          pointerEvents: 'auto',
          display:       'block',
        }}
      />

      {/* Floating tooltip */}
      <div ref={tooltipRef} className="graph-tooltip" style={{ position: 'fixed', zIndex: 30 }}>
        <div ref={ttTypeRef} className="tt-type" />
        <div ref={ttNameRef} className="tt-name" />
        <div ref={ttConnRef} className="tt-conn" />
      </div>

      {/* Legend */}
      <div className="legend" style={{ zIndex: 15 }}>
        <div className="leg-item"><div className="leg-dot" style={{ background: '#a78bfa' }} />Disease</div>
        <div className="leg-item"><div className="leg-dot" style={{ background: '#fb923c' }} />Symptom</div>
        <div className="leg-item"><div className="leg-dot" style={{ background: '#00d4aa' }} />Patient</div>
      </div>
    </>
  );
}
