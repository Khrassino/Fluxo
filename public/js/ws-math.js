'use strict';
/* ============ ws-math.js — renderizador LaTeX/MathJax offline leve ============ */

const WS_MATH_GREEK = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', varpi: 'ϖ',
  rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ',
  phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω'
};

const WS_MATH_SYMBOLS = {
  pm: '±', mp: '∓', times: '×', div: '÷', cdot: '·', ast: '∗', star: '⋆',
  bullet: '•', circ: '∘', degree: '°', prime: '′', dprime: '″',
  leq: '≤', le: '≤', geq: '≥', ge: '≥', leqslant: '⩽', geqslant: '⩾',
  neq: '≠', ne: '≠', approx: '≈',
  equiv: '≡', cong: '≅', sim: '∼', simeq: '≃', propto: '∝', asymp: '≍', doteq: '≐',
  coloneqq: '≔', ll: '≪', gg: '≫', prec: '≺', succ: '≻',
  to: '→', rightarrow: '→', leftarrow: '←', leftrightarrow: '↔',
  Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', iff: '⇔',
  implies: '⇒', mapsto: '↦', uparrow: '↑', downarrow: '↓',
  in: '∈', notin: '∉', ni: '∋', subset: '⊂', subseteq: '⊆',
  supset: '⊃', supseteq: '⊇', nsubset: '⊄',
  cup: '∪', cap: '∩', setminus: '∖', emptyset: '∅', varnothing: '∅',
  forall: '∀', exists: '∃', nexists: '∄', neg: '¬', lnot: '¬',
  land: '∧', wedge: '∧', lor: '∨', vee: '∨', top: '⊤', bot: '⊥',
  infty: '∞', partial: '∂', nabla: '∇', therefore: '∴', because: '∵',
  cdots: '⋯', ldots: '…', dots: '…', vdots: '⋮', ddots: '⋱',
  angle: '∠', measuredangle: '∡', triangle: '△', square: '□',
  parallel: '∥', perp: '⊥', hbar: 'ℏ', ell: 'ℓ', aleph: 'ℵ',
  Re: 'ℜ', Im: 'ℑ', wp: '℘', dag: '†', ddag: '‡',
  lbrace: '{', rbrace: '}', langle: '⟨', rangle: '⟩',
  lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉',
  vert: '|', Vert: '‖', mid: '∣', percent: '%'
};

const WS_MATH_BIG_OPS = {
  sum: '∑', prod: '∏', coprod: '∐', int: '∫', iint: '∬', iiint: '∭',
  oint: '∮', bigcup: '⋃', bigcap: '⋂', bigoplus: '⊕', bigotimes: '⊗',
  lim: 'lim', limsup: 'lim sup', liminf: 'lim inf', sup: 'sup', inf: 'inf',
  max: 'max', min: 'min', argmax: 'arg max', argmin: 'arg min'
};

const WS_MATH_FUNCS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp', 'det', 'dim', 'ker',
  'deg', 'gcd', 'lcm', 'mod', 'bmod', 'pmod', 'Pr', 'hom', 'rank', 'tr', 'span'
]);

const WS_MATH_BLACKBOARD = {
  R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', E: '𝔼', F: '𝔽', H: 'ℍ'
};

const WS_MATH_ACCENTS = {
  vec: '→', hat: '^', widehat: '^', bar: '¯', tilde: '˜', widetilde: '˜',
  dot: '˙', ddot: '¨', overline: 'bar', underline: 'under'
};

const WS_MATH_DOLLAR_SENTINEL = '\uE001';

function wsMathEscapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wsMaskEscapedDollars(src) {
  return String(src || '').replace(/\\\$/g, WS_MATH_DOLLAR_SENTINEL);
}

function wsUnmaskDollarsHtml(str) {
  return String(str || '').split(WS_MATH_DOLLAR_SENTINEL).join('$');
}

function wsHasMathDelimiters(text) {
  const src = wsMaskEscapedDollars(text);
  if (!src) return false;
  if (/\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/.test(src)) return true;
  return /(^|[^\\$])\$(?!\s)([^\n$]+?)(?<!\s)\$(?!\d)/.test(src);
}

function wsParseTexArg(src, pos) {
  while (pos < src.length && /\s/.test(src[pos])) pos++;
  if (pos >= src.length) return { value: '', next: pos };
  if (src[pos] === '{') {
    let depth = 1;
    let i = pos + 1;
    while (i < src.length && depth > 0) {
      if (src[i] === '\\' && i + 1 < src.length) {
        i += 2;
        continue;
      }
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    const end = depth === 0 ? i - 1 : i;
    return { value: src.slice(pos + 1, end), next: i };
  }
  if (src[pos] === '\\') {
    let i = pos + 1;
    if (i < src.length && !/[A-Za-z]/.test(src[i])) {
      return { value: src.slice(pos, i + 1), next: i + 1 };
    }
    while (i < src.length && /[A-Za-z]/.test(src[i])) i++;
    return { value: src.slice(pos, i), next: i };
  }
  return { value: src[pos], next: pos + 1 };
}

function wsParseOptBracket(src, pos) {
  let i = pos;
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] !== '[') return null;
  let depth = 1;
  let j = i + 1;
  while (j < src.length && depth > 0) {
    if (src[j] === '[') depth++;
    else if (src[j] === ']') depth--;
    j++;
  }
  if (depth !== 0) return null;
  return { value: src.slice(i + 1, j - 1), next: j };
}

function wsSplitMatrixCells(body) {
  const rows = [];
  let row = [];
  let cur = '';
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && body[i + 1] === '\\' && depth === 0) {
      row.push(cur.trim());
      rows.push(row);
      row = [];
      cur = '';
      i++;
      continue;
    }
    if (ch === '&' && depth === 0) {
      row.push(cur.trim());
      cur = '';
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    cur += ch;
  }
  if (cur.trim() || row.length) {
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

function wsSplitTopLevelDisplayLines(tex) {
  const src = String(tex || '');
  const lines = [];
  let cur = '';
  let depth = 0;
  let envDepth = 0;
  for (let i = 0; i < src.length; i++) {
    if (src.startsWith('\\begin{', i)) {
      envDepth++;
    } else if (src.startsWith('\\end{', i) && envDepth > 0) {
      envDepth--;
    }
    const ch = src[i];
    if (ch === '\\' && src[i + 1] === '\\' && depth === 0 && envDepth === 0) {
      lines.push(cur.trim());
      cur = '';
      i++;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    cur += ch;
  }
  if (cur.trim() || !lines.length) lines.push(cur.trim());
  return lines;
}

function wsMathTokenize(src) {
  const tokens = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '{') {
      const parsed = wsParseTexArg(src, i);
      tokens.push({ type: 'atom', html: '<span class="ws-m-grp">' + wsRenderTexCore(parsed.value) + '</span>' });
      i = parsed.next;
      continue;
    }

    if (ch === '^' || ch === '_') {
      const kind = ch === '^' ? 'sup' : 'sub';
      const parsed = wsParseTexArg(src, i + 1);
      tokens.push({ type: kind, html: wsRenderTexCore(parsed.value) });
      i = parsed.next;
      continue;
    }

    if (ch === '\'') {
      let count = 0;
      while (i < len && src[i] === '\'') { count++; i++; }
      const primes = count === 2 ? '″' : (count >= 3 ? '‴' : '′');
      tokens.push({ type: 'sup', html: '<span class="ws-m-prime">' + primes + '</span>' });
      continue;
    }

    if (ch === '\\') {
      if (i + 1 >= len) { i++; continue; }
      const next = src[i + 1];
      if (!/[A-Za-z]/.test(next)) {
        if (next === ',' || next === ':' || next === ';') {
          tokens.push({ type: 'atom', html: '<span class="ws-m-sp"></span>' });
        } else if (next === '!') {
          tokens.push({ type: 'atom', html: '<span class="ws-m-negsp"></span>' });
        } else if (next === ' ') {
          tokens.push({ type: 'atom', html: '&nbsp;' });
        } else if (next === '\\') {
          tokens.push({ type: 'atom', html: '<br>' });
        } else {
          tokens.push({ type: 'atom', html: wsMathEscapeHtml(next) });
        }
        i += 2;
        continue;
      }

      let j = i + 1;
      while (j < len && /[A-Za-z]/.test(src[j])) j++;
      const cmd = src.slice(i + 1, j);
      i = j;

      if (cmd === 'begin') {
        const envArg = wsParseTexArg(src, i);
        const envName = envArg.value.trim();
        const endToken = '\\end{' + envName + '}';
        const endIdx = src.indexOf(endToken, envArg.next);
        if (endIdx >= 0) {
          let bodyStart = envArg.next;
          let arrayCols = null;
          if (envName === 'array') {
            const colArg = wsParseTexArg(src, bodyStart);
            if (colArg && colArg.value) {
              arrayCols = colArg.value.replace(/[^lcr]/gi, '').toLowerCase().split('');
              bodyStart = colArg.next;
            }
          }
          const inner = src.slice(bodyStart, endIdx);
          i = endIdx + endToken.length;
          const rows = wsSplitMatrixCells(inner);
          const isAligned = envName === 'aligned' || envName === 'align' || envName === 'align*' || envName === 'split' || envName === 'eqnarray' || envName === 'eqnarray*';
          const isGather = envName === 'gathered' || envName === 'gather' || envName === 'gather*';
          const tableCls = isAligned
            ? 'ws-m-matrix ws-m-aligned'
            : (isGather ? 'ws-m-matrix ws-m-gather' : 'ws-m-matrix');
          const tableHtml = '<span class="' + tableCls + '">' + rows.map(r =>
            '<span class="ws-m-mrow">' + r.map((c, colIdx) => {
              let alignCls = '';
              if (arrayCols && arrayCols[colIdx]) {
                alignCls = ' ws-m-col-' + arrayCols[colIdx];
              }
              return '<span class="ws-m-mcell' + alignCls + '">' + wsRenderTexCore(c) + '</span>';
            }).join('') + '</span>'
          ).join('') + '</span>';
          let lDelim = '', rDelim = '';
          if (envName === 'pmatrix') { lDelim = '('; rDelim = ')'; }
          else if (envName === 'bmatrix') { lDelim = '['; rDelim = ']'; }
          else if (envName === 'Bmatrix' || envName === 'cases') { lDelim = '{'; rDelim = envName === 'cases' ? '' : '}'; }
          else if (envName === 'vmatrix') { lDelim = '|'; rDelim = '|'; }
          else if (envName === 'Vmatrix') { lDelim = '‖'; rDelim = '‖'; }
          if (lDelim || rDelim) {
            const cls = envName === 'cases' ? 'ws-m-delim ws-m-cases' : 'ws-m-delim';
            tokens.push({
              type: 'atom',
              html: '<span class="' + cls + '">' +
                (lDelim ? '<span class="ws-m-bracket">' + lDelim + '</span>' : '') +
                tableHtml +
                (rDelim ? '<span class="ws-m-bracket">' + rDelim + '</span>' : '') +
              '</span>'
            });
          } else {
            tokens.push({ type: 'atom', html: tableHtml });
          }
          continue;
        }
      }

      if (cmd === 'left' || cmd === 'right') {
        while (i < len && /\s/.test(src[i])) i++;
        let d = src[i] || '';
        if (d === '\\') {
          let k = i + 1;
          while (k < len && /[A-Za-z]/.test(src[k])) k++;
          const sym = src.slice(i + 1, k);
          i = k;
          d = WS_MATH_SYMBOLS[sym] || sym;
        } else {
          i++;
        }
        if (d && d !== '.') {
          tokens.push({ type: 'atom', html: '<span class="ws-m-fence">' + wsMathEscapeHtml(d) + '</span>' });
        }
        continue;
      }

      if (cmd === 'not') {
        let rest = i;
        while (rest < len && /\s/.test(src[rest])) rest++;
        if (src[rest] === '=') {
          tokens.push({ type: 'atom', html: '<span class="ws-m-op">≠</span>' });
          i = rest + 1;
          continue;
        }
        if (src.startsWith('\\in', rest) && !/[A-Za-z]/.test(src[rest + 3] || '')) {
          tokens.push({ type: 'atom', html: '<span class="ws-m-op">∉</span>' });
          i = rest + 3;
          continue;
        }
        if (src.startsWith('\\subset', rest) && !/[A-Za-z]/.test(src[rest + 7] || '')) {
          tokens.push({ type: 'atom', html: '<span class="ws-m-op">⊄</span>' });
          i = rest + 7;
          continue;
        }
      }

      if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
        const num = wsParseTexArg(src, i);
        const den = wsParseTexArg(src, num.next);
        i = den.next;
        tokens.push({
          type: 'atom',
          html: '<span class="ws-m-frac">' +
            '<span class="ws-m-num">' + wsRenderTexCore(num.value) + '</span>' +
            '<span class="ws-m-den">' + wsRenderTexCore(den.value) + '</span>' +
          '</span>'
        });
        continue;
      }

      if (cmd === 'binom') {
        const top = wsParseTexArg(src, i);
        const bot = wsParseTexArg(src, top.next);
        i = bot.next;
        tokens.push({
          type: 'atom',
          html: '<span class="ws-m-delim"><span class="ws-m-fence">(</span>' +
            '<span class="ws-m-binom"><span>' + wsRenderTexCore(top.value) + '</span><span>' + wsRenderTexCore(bot.value) + '</span></span>' +
            '<span class="ws-m-fence">)</span></span>'
        });
        continue;
      }

      if (cmd === 'overset' || cmd === 'stackrel') {
        const top = wsParseTexArg(src, i);
        const base = wsParseTexArg(src, top.next);
        i = base.next;
        tokens.push({
          type: 'atom',
          html: '<span class="ws-m-limits">' +
            '<span class="ws-m-lim-sup">' + wsRenderTexCore(top.value) + '</span>' +
            '<span class="ws-m-lim-base">' + wsRenderTexCore(base.value) + '</span>' +
          '</span>'
        });
        continue;
      }

      if (cmd === 'underset') {
        const bot = wsParseTexArg(src, i);
        const base = wsParseTexArg(src, bot.next);
        i = base.next;
        tokens.push({
          type: 'atom',
          html: '<span class="ws-m-limits">' +
            '<span class="ws-m-lim-base">' + wsRenderTexCore(base.value) + '</span>' +
            '<span class="ws-m-lim-sub">' + wsRenderTexCore(bot.value) + '</span>' +
          '</span>'
        });
        continue;
      }

      if (cmd === 'xrightarrow' || cmd === 'xleftarrow') {
        const subArg = wsParseOptBracket(src, i);
        const supArg = wsParseTexArg(src, subArg ? subArg.next : i);
        i = supArg.next;
        const sym = cmd === 'xleftarrow' ? '←' : '→';
        tokens.push({
          type: 'atom',
          html: '<span class="ws-m-limits ws-m-xarrow">' +
            (supArg.value ? '<span class="ws-m-lim-sup">' + wsRenderTexCore(supArg.value) + '</span>' : '') +
            '<span class="ws-m-op">' + sym + '</span>' +
            (subArg && subArg.value ? '<span class="ws-m-lim-sub">' + wsRenderTexCore(subArg.value) + '</span>' : '') +
          '</span>'
        });
        continue;
      }

      if (cmd === 'sqrt') {
        const idxArg = wsParseOptBracket(src, i);
        const rad = wsParseTexArg(src, idxArg ? idxArg.next : i);
        i = rad.next;
        tokens.push({
          type: 'atom',
          html: '<span class="ws-m-sqrt">' +
            (idxArg ? '<sup class="ws-m-rootidx">' + wsRenderTexCore(idxArg.value) + '</sup>' : '') +
            '<span class="ws-m-rad">√</span>' +
            '<span class="ws-m-radbody">' + wsRenderTexCore(rad.value) + '</span>' +
          '</span>'
        });
        continue;
      }

      if (cmd === 'text' || cmd === 'textrm' || cmd === 'mbox') {
        const arg = wsParseTexArg(src, i);
        i = arg.next;
        tokens.push({ type: 'atom', html: '<span class="ws-m-text">' + wsMathEscapeHtml(arg.value) + '</span>' });
        continue;
      }

      if (cmd === 'mathrm' || cmd === 'operatorname') {
        const arg = wsParseTexArg(src, i);
        i = arg.next;
        tokens.push({ type: 'atom', html: '<span class="ws-m-rm">' + wsRenderTexCore(arg.value) + '</span>' });
        continue;
      }

      if (cmd === 'mathbf' || cmd === 'boldsymbol' || cmd === 'bm') {
        const arg = wsParseTexArg(src, i);
        i = arg.next;
        tokens.push({ type: 'atom', html: '<span class="ws-m-bf">' + wsRenderTexCore(arg.value) + '</span>' });
        continue;
      }

      if (cmd === 'mathbb') {
        const arg = wsParseTexArg(src, i);
        i = arg.next;
        const mapped = arg.value.trim().split('').map(c => WS_MATH_BLACKBOARD[c] || c).join('');
        tokens.push({ type: 'atom', html: '<span class="ws-m-bb">' + wsMathEscapeHtml(mapped) + '</span>' });
        continue;
      }

      if (cmd === 'mathcal') {
        const arg = wsParseTexArg(src, i);
        i = arg.next;
        tokens.push({ type: 'atom', html: '<span class="ws-m-cal">' + wsMathEscapeHtml(arg.value) + '</span>' });
        continue;
      }

      if (WS_MATH_ACCENTS[cmd]) {
        const arg = wsParseTexArg(src, i);
        i = arg.next;
        const acc = WS_MATH_ACCENTS[cmd];
        if (acc === 'bar') {
          tokens.push({ type: 'atom', html: '<span class="ws-m-overline">' + wsRenderTexCore(arg.value) + '</span>' });
        } else if (acc === 'under') {
          tokens.push({ type: 'atom', html: '<span class="ws-m-underline">' + wsRenderTexCore(arg.value) + '</span>' });
        } else {
          tokens.push({
            type: 'atom',
            html: '<span class="ws-m-accent"><span class="ws-m-accmk">' + acc + '</span><span>' + wsRenderTexCore(arg.value) + '</span></span>'
          });
        }
        continue;
      }

      if (cmd === 'quad') {
        tokens.push({ type: 'atom', html: '<span class="ws-m-quad"></span>' });
        continue;
      }
      if (cmd === 'qquad') {
        tokens.push({ type: 'atom', html: '<span class="ws-m-qquad"></span>' });
        continue;
      }

      if (WS_MATH_BIG_OPS[cmd]) {
        const textOp = cmd === 'lim' || cmd === 'limsup' || cmd === 'liminf' || cmd === 'sup' || cmd === 'inf' || cmd === 'max' || cmd === 'min' || cmd === 'argmax' || cmd === 'argmin';
        tokens.push({
          type: 'atom',
          bigOp: true,
          html: '<span class="' + (textOp ? 'ws-m-funcop' : 'ws-m-bigop') + '">' + WS_MATH_BIG_OPS[cmd] + '</span>'
        });
        continue;
      }

      if (WS_MATH_FUNCS.has(cmd)) {
        tokens.push({ type: 'atom', html: '<span class="ws-m-func">' + wsMathEscapeHtml(cmd) + '</span>' });
        continue;
      }

      if (WS_MATH_GREEK[cmd]) {
        const isUpper = /^[A-Z]/.test(cmd);
        tokens.push({ type: 'atom', html: '<span class="' + (isUpper ? 'ws-m-rm' : 'ws-m-var') + '">' + WS_MATH_GREEK[cmd] + '</span>' });
        continue;
      }

      if (WS_MATH_SYMBOLS[cmd]) {
        tokens.push({ type: 'atom', html: '<span class="ws-m-op">' + WS_MATH_SYMBOLS[cmd] + '</span>' });
        continue;
      }

      tokens.push({ type: 'atom', html: '<span class="ws-m-rm">' + wsMathEscapeHtml(cmd) + '</span>' });
      continue;
    }

    if (/[A-Za-z]/.test(ch)) {
      tokens.push({ type: 'atom', html: '<span class="ws-m-var">' + ch + '</span>' });
      i++;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < len && /[0-9.,]/.test(src[j])) j++;
      tokens.push({ type: 'atom', html: '<span class="ws-m-num">' + src.slice(i, j) + '</span>' });
      i = j;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '=' || ch === '<' || ch === '>' || ch === '!') {
      const sym = ch === '-' ? '−' : ch;
      tokens.push({ type: 'atom', html: '<span class="ws-m-op">' + wsMathEscapeHtml(sym) + '</span>' });
      i++;
      continue;
    }

    tokens.push({ type: 'atom', html: '<span class="ws-m-pun">' + wsMathEscapeHtml(ch) + '</span>' });
    i++;
  }

  return tokens;
}

function wsRenderTexCore(tex) {
  const tokens = wsMathTokenize(String(tex || ''));
  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === 'atom') {
      let sup = null;
      let sub = null;
      while (i + 1 < tokens.length && (tokens[i + 1].type === 'sup' || tokens[i + 1].type === 'sub')) {
        const next = tokens[++i];
        if (next.type === 'sup') sup = sup !== null ? (sup + next.html) : next.html;
        else sub = sub !== null ? (sub + next.html) : next.html;
      }
      if (sup !== null || sub !== null) {
        if (tok.bigOp) {
          out += '<span class="ws-m-limits">' +
            (sup !== null ? '<span class="ws-m-lim-sup">' + sup + '</span>' : '') +
            '<span class="ws-m-lim-base">' + tok.html + '</span>' +
            (sub !== null ? '<span class="ws-m-lim-sub">' + sub + '</span>' : '') +
          '</span>';
        } else if (sup !== null && sub !== null) {
          out += '<span class="ws-m-base">' + tok.html + '</span>' +
            '<span class="ws-m-subsup"><span>' + sup + '</span><span>' + sub + '</span></span>';
        } else if (sup !== null) {
          out += tok.html + '<sup class="ws-m-sup">' + sup + '</sup>';
        } else {
          out += tok.html + '<sub class="ws-m-sub">' + sub + '</sub>';
        }
      } else {
        out += tok.html;
      }
    } else if (tok.type === 'sup') {
      out += '<sup class="ws-m-sup">' + tok.html + '</sup>';
    } else if (tok.type === 'sub') {
      out += '<sub class="ws-m-sub">' + tok.html + '</sub>';
    }
  }
  return out;
}

function wsRenderFormulaInner(tex, displayMode) {
  const cleanTex = String(tex || '').split(WS_MATH_DOLLAR_SENTINEL).join('\\$');
  if (displayMode) {
    const lines = wsSplitTopLevelDisplayLines(cleanTex);
    return lines.length > 1
      ? lines.map(ln => '<span class="ws-m-dline">' + wsRenderTexCore(ln) + '</span>').join('')
      : wsRenderTexCore(cleanTex);
  }
  return wsRenderTexCore(cleanTex);
}

function wsRenderFormula(tex, displayMode) {
  const cleanTex = String(tex || '').split(WS_MATH_DOLLAR_SENTINEL).join('\\$');
  const rendered = wsRenderFormulaInner(cleanTex, displayMode);
  const attr = ' data-tex="' + wsMathEscapeHtml(cleanTex) + '" data-display="' + (displayMode ? '1' : '0') + '"';
  if (displayMode) {
    return '<div class="ws-math-display" role="math"' + attr + '>' + rendered + '</div>';
  }
  return '<span class="ws-math-inline" role="math"' + attr + '>' + rendered + '</span>';
}

function wsHasNonEmptyArgAt(src, pos) {
  let i = pos;
  while (i < src.length && /\s/.test(src[i])) i++;
  if (i >= src.length) return { ok: false, next: i };
  if (src[i] === '{') {
    const parsed = wsParseTexArg(src, i);
    const trimmed = parsed.value.trim();
    if (!trimmed) return { ok: false, next: parsed.next };
    return { ok: true, next: parsed.next };
  }
  if (src[i] === '}' || src[i] === '^' || src[i] === '_') {
    return { ok: false, next: i };
  }
  const parsed = wsParseTexArg(src, i);
  return { ok: !!parsed.value.trim(), next: parsed.next };
}

function wsValidateTex(tex) {
  const src = String(tex == null ? '' : tex).trim();
  if (!src) {
    return { valid: false, isEmpty: true, code: 'empty', reason: 'Fórmula vazia' };
  }

  let braceDepth = 0;
  let fenceDepth = 0;
  const envStack = [];
  const twoArgCmds = new Set(['frac', 'dfrac', 'tfrac', 'binom', 'overset', 'stackrel', 'underset']);
  const oneArgCmds = new Set([
    'sqrt', 'vec', 'hat', 'widehat', 'bar', 'tilde', 'widetilde',
    'dot', 'ddot', 'overline', 'underline', 'text', 'textrm', 'mbox',
    'mathrm', 'operatorname', 'mathbf', 'boldsymbol', 'bm', 'mathbb', 'mathcal'
  ]);

  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') {
      braceDepth++;
      i++;
      continue;
    }
    if (ch === '}') {
      braceDepth--;
      if (braceDepth < 0) {
        return { valid: false, isEmpty: false, code: 'braces', reason: 'Chaves { } desbalanceadas' };
      }
      i++;
      continue;
    }
    if (ch === '^' || ch === '_') {
      let k = i + 1;
      while (k < src.length && /\s/.test(src[k])) k++;
      if (k >= src.length || src[k] === '}' || src[k] === '^' || src[k] === '_') {
        return { valid: false, isEmpty: false, code: 'script', reason: 'Expoente ou subscrito incompleto' };
      }
      i++;
      continue;
    }
    if (ch === '\\') {
      if (i + 1 >= src.length) {
        return { valid: false, isEmpty: false, code: 'cmd', reason: 'Comando incompleto após \\' };
      }
      const next = src[i + 1];
      if (!/[A-Za-z]/.test(next)) {
        i += 2;
        continue;
      }
      let j = i + 1;
      while (j < src.length && /[A-Za-z]/.test(src[j])) j++;
      const cmd = src.slice(i + 1, j);
      i = j;

      if (cmd === 'begin' || cmd === 'end') {
        let p = i;
        while (p < src.length && /\s/.test(src[p])) p++;
        if (src[p] !== '{') {
          return { valid: false, isEmpty: false, code: 'env', reason: 'Ambiente \\' + cmd + ' sem {nome}' };
        }
        const envArg = wsParseTexArg(src, p);
        const envName = envArg.value.trim();
        if (!envName) {
          return { valid: false, isEmpty: false, code: 'env', reason: 'Nome de ambiente vazio' };
        }
        if (cmd === 'begin') {
          envStack.push(envName);
        } else {
          const top = envStack.pop();
          if (top !== envName) {
            return { valid: false, isEmpty: false, code: 'env', reason: 'Ambiente \\end{' + envName + '} sem correspondência' };
          }
        }
        i = envArg.next;
        continue;
      }

      if (cmd === 'left') {
        let p = i;
        while (p < src.length && /\s/.test(src[p])) p++;
        if (p >= src.length) {
          return { valid: false, isEmpty: false, code: 'delim', reason: 'Falta delimitador após \\left' };
        }
        fenceDepth++;
        continue;
      }
      if (cmd === 'right') {
        let p = i;
        while (p < src.length && /\s/.test(src[p])) p++;
        if (p >= src.length) {
          return { valid: false, isEmpty: false, code: 'delim', reason: 'Falta delimitador após \\right' };
        }
        fenceDepth--;
        if (fenceDepth < 0) {
          return { valid: false, isEmpty: false, code: 'delim', reason: '\\right sem \\left correspondente' };
        }
        continue;
      }

      if (twoArgCmds.has(cmd)) {
        const a1 = wsHasNonEmptyArgAt(src, i);
        if (!a1.ok) {
          return { valid: false, isEmpty: false, code: 'arg', reason: 'Argumento incompleto em \\' + cmd, detail: cmd };
        }
        const a2 = wsHasNonEmptyArgAt(src, a1.next);
        if (!a2.ok) {
          return { valid: false, isEmpty: false, code: 'arg', reason: 'Falta segundo argumento em \\' + cmd, detail: cmd };
        }
        continue;
      }

      if (cmd === 'sqrt') {
        const opt = wsParseOptBracket(src, i);
        const a1 = wsHasNonEmptyArgAt(src, opt ? opt.next : i);
        if (!a1.ok) {
          return { valid: false, isEmpty: false, code: 'arg', reason: 'Argumento incompleto em \\sqrt', detail: 'sqrt' };
        }
        continue;
      }

      if (oneArgCmds.has(cmd)) {
        const a1 = wsHasNonEmptyArgAt(src, i);
        if (!a1.ok) {
          return { valid: false, isEmpty: false, code: 'arg', reason: 'Argumento incompleto em \\' + cmd, detail: cmd };
        }
        continue;
      }
      continue;
    }
    i++;
  }

  if (braceDepth !== 0) {
    return { valid: false, isEmpty: false, code: 'braces', reason: 'Chaves { } desbalanceadas' };
  }
  if (fenceDepth !== 0) {
    return { valid: false, isEmpty: false, code: 'delim', reason: 'Falta \\right correspondente' };
  }
  if (envStack.length) {
    const missingEnv = envStack[envStack.length - 1];
    return { valid: false, isEmpty: false, code: 'env', reason: 'Falta \\end{' + missingEnv + '}', detail: missingEnv };
  }

  return { valid: true, isEmpty: false, code: null, reason: '' };
}

function wsRenderTexSafe(tex, displayMode, lastValidHtml) {
  const check = wsValidateTex(tex);
  const fallback = typeof lastValidHtml === 'string' ? lastValidHtml : '';
  if (check.valid) {
    const innerHtml = wsRenderFormulaInner(tex, !!displayMode);
    const html = wsRenderFormula(tex, !!displayMode);
    return {
      valid: true,
      isEmpty: false,
      usedFallback: false,
      html,
      innerHtml,
      code: null,
      reason: ''
    };
  }
  return {
    valid: false,
    isEmpty: !!check.isEmpty,
    usedFallback: !!fallback,
    html: fallback,
    innerHtml: fallback,
    code: check.code,
    reason: check.reason,
    detail: check.detail || ''
  };
}

function wsDecodeBasicEntities(str) {
  return String(str || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function wsTransformMathInSegment(rawText, alreadyEscaped) {
  const decoded = alreadyEscaped ? wsDecodeBasicEntities(rawText) : String(rawText || '');
  if (!decoded) return '';
  const plain = wsMaskEscapedDollars(decoded);
  const regex = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\s)([^\n$]+?)(?<!\s)\$(?!\d)/g;
  let out = '';
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(plain)) !== null) {
    if (match.index > lastIdx) {
      const before = plain.slice(lastIdx, match.index);
      out += wsUnmaskDollarsHtml(wsMathEscapeHtml(before));
    }
    const isDisplay = match[1] != null || match[2] != null;
    const tex = match[1] != null ? match[1] : (match[2] != null ? match[2] : (match[3] != null ? match[3] : match[4]));
    out += wsRenderFormula(tex, isDisplay);
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < plain.length) {
    out += wsUnmaskDollarsHtml(wsMathEscapeHtml(plain.slice(lastIdx)));
  }
  return out;
}

function wsRenderTextWithMath(text) {
  return wsTransformMathInSegment(text, false).replace(/\n/g, '<br>');
}

function wsRenderNoteDisplayHtml(sanitizedHtml) {
  const html = String(sanitizedHtml || '');
  if (!html) return '';
  /* Transforma apenas segmentos de texto fora de tags HTML para preservar negrito, listas e alinhamento */
  const parts = html.split(/(<[^>]+>)/g);
  return parts.map(part => {
    if (!part) return '';
    if (part.charAt(0) === '<' && part.charAt(part.length - 1) === '>') return part;
    return wsTransformMathInSegment(part, true);
  }).join('');
}

function wsWrapMathSelection(rawText, start, end, displayMode) {
  const str = String(rawText || '');
  const s = Math.max(0, Math.min(str.length, Number(start) || 0));
  const e = Math.max(s, Math.min(str.length, Number(end) || s));
  const open = displayMode ? '$$' : '$';
  const close = displayMode ? '$$' : '$';
  const selected = str.slice(s, e);
  const inner = selected || '\\frac{a}{b}';
  const text = str.slice(0, s) + open + inner + close + str.slice(e);
  const selStart = s + open.length;
  const selEnd = selStart + inner.length;
  return { text, selStart, selEnd };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    wsHasMathDelimiters,
    wsRenderTexCore,
    wsRenderFormula,
    wsRenderFormulaInner,
    wsValidateTex,
    wsRenderTexSafe,
    wsRenderTextWithMath,
    wsRenderNoteDisplayHtml,
    wsWrapMathSelection
  };
}
