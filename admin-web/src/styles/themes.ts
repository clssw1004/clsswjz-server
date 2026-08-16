/**
 * 管理台主题色系统。
 * 与 Flutter 端 Colors.primaries（19 个 Material 种子色）一一对应，
 * 便于将来管理台内嵌 App 时主题匹配。采用「种子主色 + 互补辅助色」两色方案。
 *
 * 明暗模式：mode（'dark'|'light'），通过切换 html.dark 类生效
 * （与 Element Plus dark css-vars 约定一致）。
 * 默认（amber 琥珀）即原金色主色 + 紫色辅助。
 */
import { ref, computed } from 'vue';

export interface AdminTheme {
  id: string;
  name: string;
  primary: string; // 主色（种子色）
  accent: string; // 辅助色
  onPrimary: string; // 主色背景上的文字色
}

export type ThemeMode = 'dark' | 'light';

const DARK_TEXT = '#1c1204';

export const THEMES: AdminTheme[] = [
  { id: 'red', name: '红', primary: '#E53935', accent: '#FF7043', onPrimary: '#ffffff' },
  { id: 'pink', name: '粉', primary: '#D81B60', accent: '#7E57C2', onPrimary: '#ffffff' },
  { id: 'purple', name: '紫', primary: '#8E24AA', accent: '#EC407A', onPrimary: '#ffffff' },
  { id: 'deepPurple', name: '深紫', primary: '#5E35B1', accent: '#7C4DFF', onPrimary: '#ffffff' },
  { id: 'indigo', name: '靛蓝', primary: '#3949AB', accent: '#7986CB', onPrimary: '#ffffff' },
  { id: 'blue', name: '蓝', primary: '#1E88E5', accent: '#26C6DA', onPrimary: '#ffffff' },
  { id: 'lightBlue', name: '天蓝', primary: '#039BE5', accent: '#4FC3F7', onPrimary: '#ffffff' },
  { id: 'cyan', name: '青', primary: '#00ACC1', accent: '#26A69A', onPrimary: '#ffffff' },
  { id: 'teal', name: '青绿', primary: '#00897B', accent: '#66BB6A', onPrimary: '#ffffff' },
  { id: 'green', name: '绿', primary: '#43A047', accent: '#9CCC65', onPrimary: '#ffffff' },
  { id: 'lightGreen', name: '浅绿', primary: '#7CB342', accent: '#AED581', onPrimary: DARK_TEXT },
  { id: 'lime', name: '黄绿', primary: '#C0CA33', accent: '#FFD54F', onPrimary: DARK_TEXT },
  { id: 'yellow', name: '黄', primary: '#FDD835', accent: '#FFCA28', onPrimary: DARK_TEXT },
  { id: 'amber', name: '琥珀', primary: '#FFB300', accent: '#8B5CF6', onPrimary: DARK_TEXT },
  { id: 'orange', name: '橙', primary: '#FB8C00', accent: '#FFCA28', onPrimary: '#ffffff' },
  { id: 'deepOrange', name: '深橙', primary: '#F4511E', accent: '#FF8A65', onPrimary: '#ffffff' },
  { id: 'brown', name: '棕', primary: '#6D4C41', accent: '#A1887F', onPrimary: '#ffffff' },
  { id: 'blueGrey', name: '蓝灰', primary: '#546E7A', accent: '#4FC3F7', onPrimary: '#ffffff' },
  { id: 'grey', name: '灰', primary: '#757575', accent: '#B0BEC5', onPrimary: '#ffffff' },
];

const DEFAULT_ID = 'amber';
const STORAGE_KEY = 'admin_theme';
const MODE_KEY = 'admin_theme_mode';

export const activeThemeId = ref<string>(DEFAULT_ID);
export const activeTheme = computed(
  () => THEMES.find((t) => t.id === activeThemeId.value) ?? THEMES[0],
);

/** 明暗模式：默认暗色（与历史一致），可切换并持久化 */
export const mode = ref<ThemeMode>('dark');
export const isDark = computed(() => mode.value === 'dark');

/* ---------- 颜色工具 ---------- */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
/** 向 target 混合 pct(0-1)：target=#fff 即变亮，target=#000 即变暗 */
function mix(hex: string, target: string, pct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = hexToRgb(target);
  const m = (a: number, c: number) => Math.round(a + (c - a) * pct);
  return `#${[m(r, tr), m(g, tg), m(b, tb)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}
export function lighten(hex: string, pct: number): string {
  return mix(hex, '#ffffff', pct / 100);
}
export function darken(hex: string, pct: number): string {
  return mix(hex, '#000000', pct / 100);
}
function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
export { rgba };

/* ---------- 应用主题：覆盖设计令牌 CSS 变量 ---------- */
function applyCss(theme: AdminTheme): void {
  const s = document.documentElement.style;
  const dark = isDark.value;

  s.setProperty('--brand-gold', theme.primary);
  s.setProperty('--brand-gold-strong', lighten(theme.primary, 12));
  s.setProperty('--brand-gold-dark', darken(theme.primary, 18));
  s.setProperty('--brand-gold-soft', rgba(theme.primary, dark ? 0.14 : 0.18));
  s.setProperty('--on-primary', theme.onPrimary);
  s.setProperty('--glow-primary', `0 6px 24px ${rgba(theme.primary, dark ? 0.35 : 0.25)}`);

  s.setProperty('--brand-purple', theme.accent);
  s.setProperty('--brand-purple-light', lighten(theme.accent, 10));
  s.setProperty('--brand-purple-soft', rgba(theme.accent, dark ? 0.14 : 0.16));

  s.setProperty(
    '--grad-gold',
    `linear-gradient(135deg, ${theme.primary}, ${lighten(theme.primary, 14)})`,
  );
  s.setProperty(
    '--grad-purple',
    `linear-gradient(135deg, ${theme.accent}, ${lighten(theme.accent, 12)})`,
  );

  // Element Plus 主色
  s.setProperty('--el-color-primary', theme.primary);
  s.setProperty('--el-color-primary-dark-2', darken(theme.primary, 18));
  s.setProperty('--el-color-primary-light-3', lighten(theme.primary, 14));
  s.setProperty('--el-color-primary-light-5', lighten(theme.primary, 30));
  s.setProperty('--el-color-primary-light-7', lighten(theme.primary, 45));
  s.setProperty('--el-color-primary-light-8', lighten(theme.primary, 55));
  s.setProperty('--el-color-primary-light-9', lighten(theme.primary, 65));
}

export function initTheme(): void {
  // 明暗模式：先恢复，再应用 html.dark 类
  const savedMode = localStorage.getItem(MODE_KEY);
  mode.value = savedMode === 'light' ? 'light' : 'dark';
  document.documentElement.classList.toggle('dark', isDark.value);

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && THEMES.some((t) => t.id === saved)) {
    activeThemeId.value = saved;
  }
  applyCss(activeTheme.value);
}

export function setTheme(id: string): void {
  if (!THEMES.some((t) => t.id === id)) return;
  activeThemeId.value = id;
  localStorage.setItem(STORAGE_KEY, id);
  applyCss(activeTheme.value);
}

export function setMode(m: ThemeMode): void {
  if (m === mode.value) return;
  mode.value = m;
  localStorage.setItem(MODE_KEY, m);
  document.documentElement.classList.toggle('dark', m === 'dark');
  applyCss(activeTheme.value);
}

export function toggleMode(): void {
  setMode(isDark.value ? 'light' : 'dark');
}

/** 图表用主/辅色（图表重渲染时读取） */
export function chartColors() {
  const t = activeTheme.value;
  return {
    primary: t.primary,
    accent: t.accent,
    primaryLight: lighten(t.primary, 14),
    accentLight: lighten(t.accent, 10),
  };
}

/** 当前明暗模式下图表中性色（文字/边框/轴线），供 option 里替换硬编码暗色值 */
export function chartPalette() {
  return isDark.value
    ? {
        text: '#f1f5f9',
        subtext: '#64748b',
        label: '#cbd5e1',
        axis: '#94a3b8',
        sliceBorder: '#0b1120',
        labelLine: 'rgba(255,255,255,0.25)',
        other: '#475569',
      }
    : {
        text: '#0f172a',
        subtext: '#64748b',
        label: '#334155',
        axis: '#5b6b81',
        sliceBorder: '#ffffff',
        labelLine: 'rgba(15,23,42,0.18)',
        other: '#a5b4c8',
      };
}
