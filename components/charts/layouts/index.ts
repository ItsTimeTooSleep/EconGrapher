import { COLORS } from '../constants/colors'

/**
 * 深色布局基础配置
 */
export const DARK_LAYOUT_BASE = {
  paper_bgcolor: COLORS.paperBg,
  plot_bgcolor: COLORS.plotBg,
  font: { color: COLORS.text, family: 'Inter, system-ui, sans-serif', size: 12 },
  margin: { l: 55, r: 20, t: 45, b: 50 },
  xaxis: {
    gridcolor: COLORS.grid,
    linecolor: COLORS.axis,
    tickcolor: COLORS.axis,
    zerolinecolor: COLORS.axis,
    showgrid: true,
    zeroline: true,
    color: COLORS.text,
    showticklabels: false,
    minallowed: 0
  },
  yaxis: {
    gridcolor: COLORS.grid,
    linecolor: COLORS.axis,
    tickcolor: COLORS.axis,
    zerolinecolor: COLORS.axis,
    showgrid: true,
    zeroline: true,
    color: COLORS.text,
    showticklabels: false,
    minallowed: 0
  },
  legend: {
    bgcolor: 'rgba(255,255,255,0.9)',
    bordercolor: 'rgba(0,0,0,0.1)',
    borderwidth: 1,
    font: { color: COLORS.text, size: 11 }
  },
  hoverlabel: {
    bgcolor: 'rgba(255,255,255,0.98)',
    bordercolor: 'rgba(0,0,0,0.15)',
    font: { color: '#1e293b' }
  }
}

/**
 * 导出布局基础配置
 */
export const EXPORT_LAYOUT_BASE = {
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  font: { color: '#1e293b', family: 'Inter, system-ui, sans-serif', size: 12 },
  margin: { l: 55, r: 20, t: 45, b: 50 },
  xaxis: {
    gridcolor: 'rgba(0,0,0,0.08)',
    linecolor: 'rgba(0,0,0,0.25)',
    tickcolor: 'rgba(0,0,0,0.25)',
    zerolinecolor: 'rgba(0,0,0,0.25)',
    showgrid: true,
    zeroline: true,
    color: '#1e293b',
    showticklabels: false,
    minallowed: 0
  },
  yaxis: {
    gridcolor: 'rgba(0,0,0,0.08)',
    linecolor: 'rgba(0,0,0,0.25)',
    tickcolor: 'rgba(0,0,0,0.25)',
    zerolinecolor: 'rgba(0,0,0,0.25)',
    showgrid: true,
    zeroline: true,
    color: '#1e293b',
    showticklabels: false,
    minallowed: 0
  },
  legend: {
    bgcolor: 'rgba(255,255,255,0.95)',
    bordercolor: 'rgba(0,0,0,0.1)',
    borderwidth: 1,
    font: { color: '#1e293b', size: 11 }
  },
  hoverlabel: {
    bgcolor: 'rgba(255,255,255,0.98)',
    bordercolor: 'rgba(0,0,0,0.15)',
    font: { color: '#1e293b' }
  }
}

export type LayoutBase = typeof DARK_LAYOUT_BASE
