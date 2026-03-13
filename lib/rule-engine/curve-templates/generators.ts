/**
 * 曲线模板生成器
 * 
 * 根据曲线模板定义生成曲线的点集。
 * 支持线性曲线、U 形曲线、垂直线、水平线等。
 * 
 * 关键特性：
 * - 线性曲线支持无限延长（使用极大范围生成点）
 * - U 形曲线根据最低点和形状参数生成平滑曲线
 * - 支持派生曲线（MR, MFC）
 * 
 * @module curve-templates/generators
 * @author EconGrapher Team
 */

import type { Point } from '../geometry-types'
import type {
  CurveTemplate,
  LinearCurveTemplate,
  UShapeCurveTemplate,
  NShapeCurveTemplate,
  HyperbolaCurveTemplate,
  VerticalLineTemplate,
  HorizontalLineTemplate,
  PointSetCurveTemplate,
  DerivedMRCurveTemplate,
  DerivedMFCCurveTemplate,
  ResolvedCurve
} from './types'
import { DEFAULT_CURVE_STYLE, getCurveColor } from './types'

/**
 * 线性曲线的极大范围
 * 用于实现"无限延长"效果
 * Plotly 会自动裁剪超出视口的部分
 */
const EXTENDED_RANGE = {
  minX: -1000,
  maxX: 10000,
  minY: -1000,
  maxY: 10000
}

/**
 * 生成线性曲线的点集
 * 
 * 使用极大范围生成点，实现曲线"无限延长"效果。
 * 用户缩放图表时，曲线始终可见。
 * 
 * @param template - 线性曲线模板
 * @returns 点集数组
 */
export function generateLinearPoints(template: LinearCurveTemplate): Point[] {
  const { slope, intercept } = template
  const points: Point[] = []
  const steps = 200
  
  for (let i = 0; i <= steps; i++) {
    const x = EXTENDED_RANGE.minX + (i / steps) * (EXTENDED_RANGE.maxX - EXTENDED_RANGE.minX)
    const y = slope * x + intercept
    
    // 只保留 Y 值在合理范围内的点
    if (y >= EXTENDED_RANGE.minY && y <= EXTENDED_RANGE.maxY) {
      points.push({ x, y })
    }
  }
  
  return points
}

/**
 * U 形曲线生成结果
 */
interface UShapeResult {
  points: Point[]
  equation: { a: number; h: number; k: number }
}

/**
 * 生成 U 形曲线的点集
 * 
 * 使用二次函数生成 U 形曲线：
 * y = a(x - h)² + k，其中 (h, k) 是最低点
 * 
 * @param template - U 形曲线模板
 * @returns 点集数组和方程参数
 */
export function generateUShapePoints(template: UShapeCurveTemplate): UShapeResult {
  const { minimum, leftIntercept, rightY, steepness = 1 } = template
  const points: Point[] = []
  
  const h = minimum.x
  const k = minimum.y
  
  let a: number
  
  if (leftIntercept !== undefined) {
    a = (leftIntercept - k) / (h * h) * steepness
  } else if (rightY !== undefined) {
    const rightX = 2 * h
    a = (rightY - k) / ((rightX - h) * (rightX - h)) * steepness
  } else {
    a = 0.1 * steepness
  }
  
  const steps = 100
  const leftX = leftIntercept !== undefined ? 0 : Math.max(0, h - 10)
  const rightX = rightY !== undefined ? 2 * h : h + 15
  
  for (let i = 0; i <= steps; i++) {
    const x = leftX + (i / steps) * (rightX - leftX)
    const y = a * (x - h) * (x - h) + k
    
    if (y >= 0) {
      points.push({ x, y })
    }
  }
  
  return { points, equation: { a, h, k } }
}

/**
 * N 形曲线生成结果
 */
interface NShapeResult {
  points: Point[]
  equation: { a: number; h: number; k: number }
}

/**
 * 生成倒 U 形曲线的点集
 * 
 * @param template - 倒 U 形曲线模板
 * @returns 点集数组和方程参数
 */
export function generateNShapePoints(template: NShapeCurveTemplate): NShapeResult {
  const { maximum, leftIntercept, rightY, steepness = 1 } = template
  const points: Point[] = []
  
  const h = maximum.x
  const k = maximum.y
  
  let a: number
  
  if (leftIntercept !== undefined) {
    a = (leftIntercept - k) / (h * h) * steepness
  } else if (rightY !== undefined) {
    const rightX = 2 * h
    a = (rightY - k) / ((rightX - h) * (rightX - h)) * steepness
  } else {
    a = -0.1 * steepness
  }
  
  const steps = 100
  const leftX = leftIntercept !== undefined ? 0 : Math.max(0, h - 10)
  const rightX = rightY !== undefined ? 2 * h : h + 15
  
  for (let i = 0; i <= steps; i++) {
    const x = leftX + (i / steps) * (rightX - leftX)
    const y = a * (x - h) * (x - h) + k
    
    if (y >= 0) {
      points.push({ x, y })
    }
  }
  
  return { points, equation: { a, h, k } }
}

/**
 * 双曲线生成结果
 */
interface HyperbolaResult {
  points: Point[]
  equation: { k: number; h: number; v: number }
}

/**
 * 生成双曲线的点集
 * 
 * 方程形式：y = k / (x - h) + v
 * 简化形式：y = k / x（当 h=0, v=0 时）
 * 用于 AFC（平均固定成本）等曲线
 * 
 * @param template - 双曲线模板
 * @returns 点集数组和方程参数
 */
export function generateHyperbolaPoints(template: HyperbolaCurveTemplate): HyperbolaResult {
  const { k, h = 0, v = 0, startX = 0.5 } = template
  const points: Point[] = []
  
  const steps = 100
  const endX = 20
  
  for (let i = 0; i <= steps; i++) {
    const x = startX + (i / steps) * (endX - startX)
    const denominator = x - h
    if (Math.abs(denominator) > 1e-10) {
      const y = k / denominator + v
      if (y >= 0 && y <= EXTENDED_RANGE.maxY) {
        points.push({ x, y })
      }
    }
  }
  
  return { points, equation: { k, h, v } }
}

/**
 * 生成垂直线的点集
 * 
 * @param template - 垂直线模板
 * @returns 点集数组（两个端点）
 */
export function generateVerticalLinePoints(template: VerticalLineTemplate): Point[] {
  return [
    { x: template.x, y: EXTENDED_RANGE.minY },
    { x: template.x, y: EXTENDED_RANGE.maxY }
  ]
}

/**
 * 生成水平线的点集
 * 
 * @param template - 水平线模板
 * @returns 点集数组（两个端点）
 */
export function generateHorizontalLinePoints(template: HorizontalLineTemplate): Point[] {
  return [
    { x: EXTENDED_RANGE.minX, y: template.y },
    { x: EXTENDED_RANGE.maxX, y: template.y }
  ]
}

/**
 * 解析曲线模板，生成 ResolvedCurve
 * 
 * 这是曲线模板的主要入口函数。
 * 根据模板类型调用相应的生成函数。
 * 
 * @param template - 曲线模板
 * @param resolvedCurves - 已解析的曲线映射（用于派生曲线）
 * @returns 解析后的曲线
 */
export function resolveCurve(
  template: CurveTemplate,
  resolvedCurves?: Map<string, ResolvedCurve>
): ResolvedCurve {
  let points: Point[]
  let equation: { 
    slope?: number
    intercept?: number
    quadratic?: { a: number; h: number; k: number }
    hyperbola?: { k: number; h: number; v: number }
  } | undefined
  
  switch (template.type) {
    case 'linear':
      points = generateLinearPoints(template)
      equation = { slope: template.slope, intercept: template.intercept }
      break
      
    case 'uShape': {
      const result = generateUShapePoints(template)
      points = result.points
      equation = { quadratic: result.equation }
      break
    }
      
    case 'nShape': {
      const result = generateNShapePoints(template)
      points = result.points
      equation = { quadratic: result.equation }
      break
    }
      
    case 'hyperbola': {
      const result = generateHyperbolaPoints(template)
      points = result.points
      equation = { hyperbola: result.equation }
      break
    }
      
    case 'vertical':
      points = generateVerticalLinePoints(template)
      equation = { slope: Infinity, intercept: undefined }
      break
      
    case 'horizontal':
      points = generateHorizontalLinePoints(template)
      equation = { slope: 0, intercept: template.y }
      break
      
    case 'pointSet':
      points = template.points
      break
      
    case 'derivedMR':
      points = generateDerivedMRPoints(template, resolvedCurves)
      break
      
    case 'derivedMFC':
      points = generateDerivedMFCPoints(template, resolvedCurves)
      break
      
    default:
      throw new Error(`Unknown curve template type: ${(template as CurveTemplate).type}`)
  }
  
  return {
    id: template.id,
    label: template.label,
    points,
    color: template.color || getCurveColor(template.label),
    dashed: template.dashed ?? DEFAULT_CURVE_STYLE.dashed,
    lineWidth: template.lineWidth ?? DEFAULT_CURVE_STYLE.lineWidth,
    equation
  }
}

/**
 * 生成派生 MR 曲线的点集
 * 
 * MR 曲线的斜率是需求曲线斜率的 2 倍，截距相同。
 * 
 * @param template - 派生 MR 曲线模板
 * @param resolvedCurves - 已解析的曲线映射
 * @returns 点集数组
 */
function generateDerivedMRPoints(
  template: DerivedMRCurveTemplate,
  resolvedCurves?: Map<string, ResolvedCurve>
): Point[] {
  if (!resolvedCurves) {
    throw new Error('resolvedCurves is required for derived MR curve')
  }
  
  const sourceCurve = resolvedCurves.get(template.fromCurve)
  if (!sourceCurve) {
    throw new Error(`Source curve not found: ${template.fromCurve}`)
  }
  
  if (!sourceCurve.equation?.slope || !sourceCurve.equation?.intercept) {
    throw new Error(`Source curve does not have a linear equation: ${template.fromCurve}`)
  }
  
  // MR 斜率是需求曲线斜率的 2 倍，截距相同
  const mrSlope = sourceCurve.equation.slope * 2
  const mrIntercept = sourceCurve.equation.intercept
  
  return generateLinearPoints({
    type: 'linear',
    id: template.id,
    label: template.label,
    slope: mrSlope,
    intercept: mrIntercept
  })
}

/**
 * 生成派生 MFC 曲线的点集
 * 
 * MFC 曲线的斜率是供给曲线斜率的 2 倍，截距相同。
 * 
 * @param template - 派生 MFC 曲线模板
 * @param resolvedCurves - 已解析的曲线映射
 * @returns 点集数组
 */
function generateDerivedMFCPoints(
  template: DerivedMFCCurveTemplate,
  resolvedCurves?: Map<string, ResolvedCurve>
): Point[] {
  if (!resolvedCurves) {
    throw new Error('resolvedCurves is required for derived MFC curve')
  }
  
  const sourceCurve = resolvedCurves.get(template.fromCurve)
  if (!sourceCurve) {
    throw new Error(`Source curve not found: ${template.fromCurve}`)
  }
  
  if (!sourceCurve.equation?.slope || !sourceCurve.equation?.intercept) {
    throw new Error(`Source curve does not have a linear equation: ${template.fromCurve}`)
  }
  
  // MFC 斜率是供给曲线斜率的 2 倍，截距相同
  const mfcSlope = sourceCurve.equation.slope * 2
  const mfcIntercept = sourceCurve.equation.intercept
  
  return generateLinearPoints({
    type: 'linear',
    id: template.id,
    label: template.label,
    slope: mfcSlope,
    intercept: mfcIntercept
  })
}

/**
 * 批量解析曲线模板
 * 
 * 按依赖顺序解析曲线，先解析基础曲线，再解析派生曲线。
 * 
 * @param templates - 曲线模板数组
 * @returns 解析后的曲线映射
 */
export function resolveCurves(templates: CurveTemplate[]): Map<string, ResolvedCurve> {
  const resolvedCurves = new Map<string, ResolvedCurve>()
  
  // 第一遍：解析非派生曲线
  const derivedTemplates: CurveTemplate[] = []
  
  for (const template of templates) {
    if (template.type === 'derivedMR' || template.type === 'derivedMFC') {
      derivedTemplates.push(template)
    } else {
      const resolved = resolveCurve(template, resolvedCurves)
      resolvedCurves.set(template.id, resolved)
    }
  }
  
  // 第二遍：解析派生曲线
  for (const template of derivedTemplates) {
    const resolved = resolveCurve(template, resolvedCurves)
    resolvedCurves.set(template.id, resolved)
  }
  
  return resolvedCurves
}

/**
 * 计算线性曲线在指定 X 坐标处的 Y 值
 * 
 * @param curve - 解析后的曲线
 * @param x - X 坐标
 * @returns Y 坐标
 */
export function getYAtX(curve: ResolvedCurve, x: number): number | null {
  if (curve.equation?.slope !== undefined && curve.equation?.intercept !== undefined) {
    return curve.equation.slope * x + curve.equation.intercept
  }
  
  // 对于点集曲线，使用插值
  if (curve.points.length < 2) {
    return null
  }
  
  // 找到 x 所在的区间
  for (let i = 0; i < curve.points.length - 1; i++) {
    const p1 = curve.points[i]
    const p2 = curve.points[i + 1]
    
    const minX = Math.min(p1.x, p2.x)
    const maxX = Math.max(p1.x, p2.x)
    
    if (x >= minX && x <= maxX) {
      // 线性插值
      const t = (x - p1.x) / (p2.x - p1.x)
      return p1.y + t * (p2.y - p1.y)
    }
  }
  
  return null
}

/**
 * 计算线性曲线在指定 Y 坐标处的 X 值
 * 
 * @param curve - 解析后的曲线
 * @param y - Y 坐标
 * @returns X 坐标
 */
export function getXAtY(curve: ResolvedCurve, y: number): number | null {
  if (curve.equation?.slope !== undefined && curve.equation?.intercept !== undefined) {
    if (curve.equation.slope === 0) {
      return null // 水平线
    }
    return (y - curve.equation.intercept) / curve.equation.slope
  }
  
  // 对于点集曲线，使用反向插值
  if (curve.points.length < 2) {
    return null
  }
  
  for (let i = 0; i < curve.points.length - 1; i++) {
    const p1 = curve.points[i]
    const p2 = curve.points[i + 1]
    
    const minY = Math.min(p1.y, p2.y)
    const maxY = Math.max(p1.y, p2.y)
    
    if (y >= minY && y <= maxY) {
      if (Math.abs(p2.y - p1.y) < 1e-10) {
        continue // 水平线段
      }
      
      const t = (y - p1.y) / (p2.y - p1.y)
      return p1.x + t * (p2.x - p1.x)
    }
  }
  
  return null
}

/**
 * 计算两条曲线的交点
 * 
 * 支持以下场景：
 * 1. 两条线性曲线的交点
 * 2. 线性曲线与点集曲线的交点
 * 3. 两条二次曲线的交点
 * 4. 二次曲线与点集曲线的交点
 * 5. 两条点集曲线的交点
 * 6. 双曲线与其他曲线的交点
 * 
 * @param curve1 - 第一条曲线
 * @param curve2 - 第二条曲线
 * @returns 交点坐标，若无交点则返回 null
 */
export function calculateIntersection(
  curve1: ResolvedCurve,
  curve2: ResolvedCurve
): Point | null {
  // 两条线性曲线的交点
  if (
    curve1.equation?.slope !== undefined && curve1.equation?.intercept !== undefined &&
    curve2.equation?.slope !== undefined && curve2.equation?.intercept !== undefined
  ) {
    const slope1 = curve1.equation.slope
    const slope2 = curve2.equation.slope
    const intercept1 = curve1.equation.intercept
    const intercept2 = curve2.equation.intercept
    
    if (Math.abs(slope1 - slope2) < 1e-10) {
      return null
    }
    
    const x = (intercept2 - intercept1) / (slope1 - slope2)
    const y = slope1 * x + intercept1
    
    if (x < 0 || y < 0) {
      return null
    }
    
    return { x, y }
  }
  
  // 两条二次曲线的交点
  if (
    curve1.equation?.quadratic !== undefined &&
    curve2.equation?.quadratic !== undefined
  ) {
    return findQuadraticIntersection(curve1, curve2)
  }
  
  // 二次曲线与线性曲线的交点
  if (
    curve1.equation?.quadratic !== undefined &&
    curve2.equation?.slope !== undefined && curve2.equation?.intercept !== undefined
  ) {
    return findQuadraticLinearIntersection(curve1, curve2)
  }
  if (
    curve2.equation?.quadratic !== undefined &&
    curve1.equation?.slope !== undefined && curve1.equation?.intercept !== undefined
  ) {
    return findQuadraticLinearIntersection(curve2, curve1)
  }
  
  // 双曲线与线性曲线的交点
  if (
    curve1.equation?.hyperbola !== undefined &&
    curve2.equation?.slope !== undefined && curve2.equation?.intercept !== undefined
  ) {
    return findHyperbolaLinearIntersection(curve1, curve2)
  }
  if (
    curve2.equation?.hyperbola !== undefined &&
    curve1.equation?.slope !== undefined && curve1.equation?.intercept !== undefined
  ) {
    return findHyperbolaLinearIntersection(curve2, curve1)
  }
  
  // 双曲线与二次曲线的交点
  if (
    curve1.equation?.hyperbola !== undefined &&
    curve2.equation?.quadratic !== undefined
  ) {
    return findHyperbolaQuadraticIntersection(curve1, curve2)
  }
  if (
    curve2.equation?.hyperbola !== undefined &&
    curve1.equation?.quadratic !== undefined
  ) {
    return findHyperbolaQuadraticIntersection(curve2, curve1)
  }
  
  // 线性曲线与点集曲线的交点
  const linearCurve = 
    (curve1.equation?.slope !== undefined && curve1.equation?.intercept !== undefined) ? curve1 :
    (curve2.equation?.slope !== undefined && curve2.equation?.intercept !== undefined) ? curve2 : null
  
  const pointSetCurve = linearCurve === curve1 ? curve2 : curve1
  
  if (linearCurve && pointSetCurve.points.length >= 2) {
    return findLinearPointSetIntersection(linearCurve, pointSetCurve)
  }
  
  // 二次曲线与点集曲线的交点
  const quadraticCurve = 
    curve1.equation?.quadratic !== undefined ? curve1 :
    curve2.equation?.quadratic !== undefined ? curve2 : null
  
  const otherCurve = quadraticCurve === curve1 ? curve2 : curve1
  
  if (quadraticCurve && otherCurve.points.length >= 2) {
    return findQuadraticPointSetIntersection(quadraticCurve, otherCurve)
  }
  
  // 双曲线与点集曲线的交点
  const hyperbolaCurve = 
    curve1.equation?.hyperbola !== undefined ? curve1 :
    curve2.equation?.hyperbola !== undefined ? curve2 : null
  
  const otherCurveForHyperbola = hyperbolaCurve === curve1 ? curve2 : curve1
  
  if (hyperbolaCurve && otherCurveForHyperbola.points.length >= 2) {
    return findHyperbolaPointSetIntersection(hyperbolaCurve, otherCurveForHyperbola)
  }
  
  // 两条点集曲线的交点
  if (curve1.points.length >= 2 && curve2.points.length >= 2) {
    return findPointSetIntersection(curve1, curve2)
  }
  
  return null
}

/**
 * 计算两条二次曲线的交点
 * 
 * 使用数值方法求解：y1 = y2
 * a1(x - h1)² + k1 = a2(x - h2)² + k2
 * 
 * @param curve1 - 第一条二次曲线
 * @param curve2 - 第二条二次曲线
 * @returns 交点坐标，若无交点则返回 null
 */
function findQuadraticIntersection(
  curve1: ResolvedCurve,
  curve2: ResolvedCurve
): Point | null {
  const q1 = curve1.equation!.quadratic!
  const q2 = curve2.equation!.quadratic!
  
  // 展开: a1(x - h1)² + k1 = a2(x - h2)² + k2
  // a1(x² - 2h1x + h1²) + k1 = a2(x² - 2h2x + h2²) + k2
  // a1x² - 2a1h1x + a1h1² + k1 = a2x² - 2a2h2x + a2h2² + k2
  // (a1 - a2)x² + (-2a1h1 + 2a2h2)x + (a1h1² - a2h2² + k1 - k2) = 0
  // Ax² + Bx + C = 0
  
  const A = q1.a - q2.a
  const B = -2 * q1.a * q1.h + 2 * q2.a * q2.h
  const C = q1.a * q1.h * q1.h - q2.a * q2.h * q2.h + q1.k - q2.k
  
  // 如果 A ≈ 0，退化为线性方程
  if (Math.abs(A) < 1e-10) {
    if (Math.abs(B) < 1e-10) {
      return null
    }
    const x = -C / B
    const y = q1.a * (x - q1.h) * (x - q1.h) + q1.k
    if (x >= 0 && y >= 0) {
      return { x, y }
    }
    return null
  }
  
  const discriminant = B * B - 4 * A * C
  
  if (discriminant < 0) {
    return null
  }
  
  const sqrtD = Math.sqrt(discriminant)
  const x1 = (-B + sqrtD) / (2 * A)
  const x2 = (-B - sqrtD) / (2 * A)
  
  const candidates: Point[] = []
  
  for (const x of [x1, x2]) {
    const y = q1.a * (x - q1.h) * (x - q1.h) + q1.k
    if (x >= 0 && y >= 0) {
      candidates.push({ x, y })
    }
  }
  
  if (candidates.length === 0) {
    return null
  }
  
  // 返回第一个有效交点（通常 MC 和 ATC 只有一个交点）
  return candidates[0]
}

/**
 * 计算二次曲线与线性曲线的交点
 * 
 * @param quadraticCurve - 二次曲线
 * @param linearCurve - 线性曲线
 * @returns 交点坐标，若无交点则返回 null
 */
function findQuadraticLinearIntersection(
  quadraticCurve: ResolvedCurve,
  linearCurve: ResolvedCurve
): Point | null {
  const q = quadraticCurve.equation!.quadratic!
  const slope = linearCurve.equation!.slope!
  const intercept = linearCurve.equation!.intercept!
  
  // a(x - h)² + k = slope * x + intercept
  // a(x² - 2hx + h²) + k = slope * x + intercept
  // ax² - 2ahx + ah² + k - slope * x - intercept = 0
  // ax² + (-2ah - slope)x + (ah² + k - intercept) = 0
  
  const A = q.a
  const B = -2 * q.a * q.h - slope
  const C = q.a * q.h * q.h + q.k - intercept
  
  if (Math.abs(A) < 1e-10) {
    if (Math.abs(B) < 1e-10) {
      return null
    }
    const x = -C / B
    const y = slope * x + intercept
    if (x >= 0 && y >= 0) {
      return { x, y }
    }
    return null
  }
  
  const discriminant = B * B - 4 * A * C
  
  if (discriminant < 0) {
    return null
  }
  
  const sqrtD = Math.sqrt(discriminant)
  const x1 = (-B + sqrtD) / (2 * A)
  const x2 = (-B - sqrtD) / (2 * A)
  
  for (const x of [x1, x2]) {
    const y = slope * x + intercept
    if (x >= 0 && y >= 0) {
      return { x, y }
    }
  }
  
  return null
}

/**
 * 计算二次曲线与点集曲线的交点
 * 
 * @param quadraticCurve - 二次曲线
 * @param pointSetCurve - 点集曲线
 * @returns 交点坐标，若无交点则返回 null
 */
function findQuadraticPointSetIntersection(
  quadraticCurve: ResolvedCurve,
  pointSetCurve: ResolvedCurve
): Point | null {
  const q = quadraticCurve.equation!.quadratic!
  const points = pointSetCurve.points
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    const intersection = findSegmentQuadraticIntersection(p1, p2, q)
    if (intersection) {
      return intersection
    }
  }
  
  return null
}

/**
 * 计算线段与二次曲线的交点
 * 
 * @param segStart - 线段起点
 * @param segEnd - 线段终点
 * @param q - 二次曲线参数
 * @returns 交点坐标，若无交点则返回 null
 */
function findSegmentQuadraticIntersection(
  segStart: Point,
  segEnd: Point,
  q: { a: number; h: number; k: number }
): Point | null {
  const dx = segEnd.x - segStart.x
  const dy = segEnd.y - segStart.y
  
  if (Math.abs(dx) < 1e-10) {
    const x = segStart.x
    const y = q.a * (x - q.h) * (x - q.h) + q.k
    const minY = Math.min(segStart.y, segEnd.y)
    const maxY = Math.max(segStart.y, segEnd.y)
    if (y >= minY && y <= maxY && x >= 0 && y >= 0) {
      return { x, y }
    }
    return null
  }
  
  const m = dy / dx
  const b = segStart.y - m * segStart.x
  
  // m * x + b = a(x - h)² + k
  // m * x + b = a(x² - 2hx + h²) + k
  // ax² + (-2ah - m)x + (ah² + k - b) = 0
  
  const A = q.a
  const B = -2 * q.a * q.h - m
  const C = q.a * q.h * q.h + q.k - b
  
  if (Math.abs(A) < 1e-10) {
    if (Math.abs(B) < 1e-10) {
      return null
    }
    const x = -C / B
    const y = m * x + b
    const minX = Math.min(segStart.x, segEnd.x)
    const maxX = Math.max(segStart.x, segEnd.x)
    if (x >= minX - 1e-6 && x <= maxX + 1e-6 && x >= 0 && y >= 0) {
      return { x, y }
    }
    return null
  }
  
  const discriminant = B * B - 4 * A * C
  
  if (discriminant < 0) {
    return null
  }
  
  const sqrtD = Math.sqrt(discriminant)
  const x1 = (-B + sqrtD) / (2 * A)
  const x2 = (-B - sqrtD) / (2 * A)
  
  const minX = Math.min(segStart.x, segEnd.x)
  const maxX = Math.max(segStart.x, segEnd.x)
  
  for (const x of [x1, x2]) {
    const y = m * x + b
    if (x >= minX - 1e-6 && x <= maxX + 1e-6 && x >= 0 && y >= 0) {
      return { x, y }
    }
  }
  
  return null
}

/**
 * 计算两条点集曲线的交点
 * 
 * 遍历两条曲线的每个线段，计算交点。
 * 
 * @param curve1 - 第一条点集曲线
 * @param curve2 - 第二条点集曲线
 * @returns 交点坐标，若无交点则返回 null
 */
function findPointSetIntersection(
  curve1: ResolvedCurve,
  curve2: ResolvedCurve
): Point | null {
  const points1 = curve1.points
  const points2 = curve2.points
  
  for (let i = 0; i < points1.length - 1; i++) {
    for (let j = 0; j < points2.length - 1; j++) {
      const intersection = findSegmentIntersection(
        points1[i], points1[i + 1],
        points2[j], points2[j + 1]
      )
      if (intersection) {
        return intersection
      }
    }
  }
  
  return null
}

/**
 * 计算两条线段的交点
 * 
 * @param p1 - 第一条线段起点
 * @param p2 - 第一条线段终点
 * @param p3 - 第二条线段起点
 * @param p4 - 第二条线段终点
 * @returns 交点坐标，若无交点则返回 null
 */
function findSegmentIntersection(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): Point | null {
  const d1x = p2.x - p1.x
  const d1y = p2.y - p1.y
  const d2x = p4.x - p3.x
  const d2y = p4.y - p3.y
  
  const cross = d1x * d2y - d1y * d2x
  
  if (Math.abs(cross) < 1e-10) {
    return null
  }
  
  const dx = p3.x - p1.x
  const dy = p3.y - p1.y
  
  const t1 = (dx * d2y - dy * d2x) / cross
  const t2 = (dx * d1y - dy * d1x) / cross
  
  if (t1 >= -1e-6 && t1 <= 1 + 1e-6 && t2 >= -1e-6 && t2 <= 1 + 1e-6) {
    const x = p1.x + t1 * d1x
    const y = p1.y + t1 * d1y
    
    if (x >= 0 && y >= 0) {
      return { x, y }
    }
  }
  
  return null
}

/**
 * 计算线性曲线与点集曲线的交点
 * 
 * 遍历点集曲线的每个线段，计算与线性曲线的交点。
 * 
 * @param linearCurve - 线性曲线（必须有 equation）
 * @param pointSetCurve - 点集曲线
 * @returns 交点坐标，若无交点则返回 null
 */
function findLinearPointSetIntersection(
  linearCurve: ResolvedCurve,
  pointSetCurve: ResolvedCurve
): Point | null {
  const slope = linearCurve.equation!.slope!
  const intercept = linearCurve.equation!.intercept!
  const points = pointSetCurve.points
  
  // 遍历点集曲线的每个线段
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    // 计算线段与线性曲线的交点
    const intersection = findSegmentLineIntersection(p1, p2, slope, intercept)
    
    if (intersection) {
      return intersection
    }
  }
  
  return null
}

/**
 * 计算线段与线性曲线的交点
 * 
 * @param segStart - 线段起点
 * @param segEnd - 线段终点
 * @param slope - 线性曲线斜率
 * @param intercept - 线性曲线截距
 * @returns 交点坐标，若无交点则返回 null
 */
function findSegmentLineIntersection(
  segStart: Point,
  segEnd: Point,
  slope: number,
  intercept: number
): Point | null {
  // 线段的两点式参数方程：
  // x = x1 + t * (x2 - x1)
  // y = y1 + t * (y2 - y1)
  // 其中 t ∈ [0, 1]
  
  // 线性曲线方程：y = slope * x + intercept
  
  // 代入得：
  // y1 + t * (y2 - y1) = slope * (x1 + t * (x2 - x1)) + intercept
  // y1 + t * dy = slope * x1 + t * slope * dx + intercept
  // t * dy - t * slope * dx = slope * x1 + intercept - y1
  // t * (dy - slope * dx) = slope * x1 + intercept - y1
  
  const dx = segEnd.x - segStart.x
  const dy = segEnd.y - segStart.y
  
  // 特殊情况：水平线与水平线段（无交点或重合）
  if (slope === 0 && Math.abs(dy) < 1e-10) {
    // 检查是否重合
    if (Math.abs(segStart.y - intercept) < 1e-10) {
      // 重合，返回线段中点
      return { x: (segStart.x + segEnd.x) / 2, y: intercept }
    }
    return null
  }
  
  // 计算参数 t
  const denominator = dy - slope * dx
  
  // 线段与线性曲线平行
  if (Math.abs(denominator) < 1e-10) {
    return null
  }
  
  const t = (slope * segStart.x + intercept - segStart.y) / denominator
  
  if (t < -1e-10 || t > 1 + 1e-10) {
    return null
  }
  
  const x = segStart.x + t * dx
  const y = segStart.y + t * dy
  
  if (x < -1e-6 || y < -1e-6) {
    return null
  }
  
  return { x, y }
}

/**
 * 计算双曲线与线性曲线的交点
 * 
 * 方程：k/(x-h) + v = m*x + b
 * 
 * @param hyperbolaCurve - 双曲线
 * @param linearCurve - 线性曲线
 * @returns 交点坐标，若无交点则返回 null
 */
function findHyperbolaLinearIntersection(
  hyperbolaCurve: ResolvedCurve,
  linearCurve: ResolvedCurve
): Point | null {
  const hyp = hyperbolaCurve.equation!.hyperbola!
  const m = linearCurve.equation!.slope!
  const b = linearCurve.equation!.intercept!
  
  // k/(x-h) + v = m*x + b
  // k + v*(x-h) = (m*x + b)*(x-h)
  // k + vx - vh = mx² - mh*x + bx - bh
  // mx² + (b - mh - v)*x + (-bh - k + vh) = 0
  
  const A = m
  const B = b - m * hyp.h - hyp.v
  const C = -b * hyp.h - hyp.k + hyp.v * hyp.h
  
  if (Math.abs(A) < 1e-10) {
    if (Math.abs(B) < 1e-10) {
      return null
    }
    const x = -C / B
    if (x > hyp.h + 1e-6 && x >= 0) {
      const y = hyp.k / (x - hyp.h) + hyp.v
      if (y >= 0) {
        return { x, y }
      }
    }
    return null
  }
  
  const discriminant = B * B - 4 * A * C
  
  if (discriminant < 0) {
    return null
  }
  
  const sqrtD = Math.sqrt(discriminant)
  const x1 = (-B + sqrtD) / (2 * A)
  const x2 = (-B - sqrtD) / (2 * A)
  
  for (const x of [x1, x2]) {
    if (x > hyp.h + 1e-6 && x >= 0) {
      const y = hyp.k / (x - hyp.h) + hyp.v
      if (y >= 0) {
        return { x, y }
      }
    }
  }
  
  return null
}

/**
 * 计算双曲线与二次曲线的交点
 * 
 * 使用数值方法求解
 * 
 * @param hyperbolaCurve - 双曲线
 * @param quadraticCurve - 二次曲线
 * @returns 交点坐标，若无交点则返回 null
 */
function findHyperbolaQuadraticIntersection(
  hyperbolaCurve: ResolvedCurve,
  quadraticCurve: ResolvedCurve
): Point | null {
  const hyp = hyperbolaCurve.equation!.hyperbola!
  const quad = quadraticCurve.equation!.quadratic!
  
  // k/(x-h) + v = a(x-hq)² + kq
  // k + v(x-h) = a(x-hq)²(x-h) + kq(x-h)
  // 这是一个三次方程，使用数值方法求解
  
  const startX = hyp.h + 0.1
  const endX = 20
  
  const f = (x: number): number => {
    const hypY = hyp.k / (x - hyp.h) + hyp.v
    const quadY = quad.a * (x - quad.h) * (x - quad.h) + quad.k
    return hypY - quadY
  }
  
  const intersection = findRootBisection(f, startX, endX)
  
  if (intersection !== null) {
    const y = hyp.k / (intersection - hyp.h) + hyp.v
    if (y >= 0) {
      return { x: intersection, y }
    }
  }
  
  return null
}

/**
 * 计算双曲线与点集曲线的交点
 * 
 * @param hyperbolaCurve - 双曲线
 * @param pointSetCurve - 点集曲线
 * @returns 交点坐标，若无交点则返回 null
 */
function findHyperbolaPointSetIntersection(
  hyperbolaCurve: ResolvedCurve,
  pointSetCurve: ResolvedCurve
): Point | null {
  const hyp = hyperbolaCurve.equation!.hyperbola!
  const points = pointSetCurve.points
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    const intersection = findSegmentHyperbolaIntersection(p1, p2, hyp)
    if (intersection) {
      return intersection
    }
  }
  
  return null
}

/**
 * 计算线段与双曲线的交点
 * 
 * @param segStart - 线段起点
 * @param segEnd - 线段终点
 * @param hyp - 双曲线参数
 * @returns 交点坐标，若无交点则返回 null
 */
function findSegmentHyperbolaIntersection(
  segStart: Point,
  segEnd: Point,
  hyp: { k: number; h: number; v: number }
): Point | null {
  const dx = segEnd.x - segStart.x
  const dy = segEnd.y - segStart.y
  
  if (Math.abs(dx) < 1e-10) {
    const x = segStart.x
    if (x <= hyp.h + 1e-6) {
      return null
    }
    const y = hyp.k / (x - hyp.h) + hyp.v
    const minY = Math.min(segStart.y, segEnd.y)
    const maxY = Math.max(segStart.y, segEnd.y)
    if (y >= minY && y <= maxY && y >= 0) {
      return { x, y }
    }
    return null
  }
  
  const m = dy / dx
  const b = segStart.y - m * segStart.x
  
  // m*x + b = k/(x-h) + v
  // (m*x + b)(x-h) = k + v(x-h)
  // mx² - mh*x + bx - bh = k + vx - vh
  // mx² + (b - mh - v)x + (-bh - k + vh) = 0
  
  const A = m
  const B = b - m * hyp.h - hyp.v
  const C = -b * hyp.h - hyp.k + hyp.v * hyp.h
  
  if (Math.abs(A) < 1e-10) {
    if (Math.abs(B) < 1e-10) {
      return null
    }
    const x = -C / B
    const y = m * x + b
    const minX = Math.min(segStart.x, segEnd.x)
    const maxX = Math.max(segStart.x, segEnd.x)
    if (x >= minX - 1e-6 && x <= maxX + 1e-6 && x > hyp.h + 1e-6 && x >= 0 && y >= 0) {
      return { x, y }
    }
    return null
  }
  
  const discriminant = B * B - 4 * A * C
  
  if (discriminant < 0) {
    return null
  }
  
  const sqrtD = Math.sqrt(discriminant)
  const x1 = (-B + sqrtD) / (2 * A)
  const x2 = (-B - sqrtD) / (2 * A)
  
  const minX = Math.min(segStart.x, segEnd.x)
  const maxX = Math.max(segStart.x, segEnd.x)
  
  for (const x of [x1, x2]) {
    const y = m * x + b
    if (x >= minX - 1e-6 && x <= maxX + 1e-6 && x > hyp.h + 1e-6 && x >= 0 && y >= 0) {
      return { x, y }
    }
  }
  
  return null
}

/**
 * 使用二分法求解方程 f(x) = 0 的根
 * 
 * @param f - 目标函数
 * @param a - 区间左端点
 * @param b - 区间右端点
 * @param maxIterations - 最大迭代次数
 * @returns 根的近似值，若无根则返回 null
 */
function findRootBisection(
  f: (x: number) => number,
  a: number,
  b: number,
  maxIterations: number = 100
): number | null {
  let fa = f(a)
  let fb = f(b)
  
  if (fa * fb > 0) {
    return null
  }
  
  for (let i = 0; i < maxIterations; i++) {
    const mid = (a + b) / 2
    const fmid = f(mid)
    
    if (Math.abs(fmid) < 1e-6 || Math.abs(b - a) < 1e-6) {
      return mid
    }
    
    if (fa * fmid < 0) {
      b = mid
      fb = fmid
    } else {
      a = mid
      fa = fmid
    }
  }
  
  return (a + b) / 2
}
