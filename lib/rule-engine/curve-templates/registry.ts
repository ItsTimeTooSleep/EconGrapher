/**
 * 曲线模板注册表
 * 
 * 管理所有曲线模板，提供查找、验证、依赖解析等功能。
 * 
 * @module curve-templates/registry
 * @author EconGrapher Team
 */

import type {
  CurveTemplate,
  ResolvedCurve,
  CurveTemplateValidation
} from './types'
import { resolveCurves } from './generators'

/**
 * 曲线模板注册表类
 * 
 * 负责管理曲线模板的生命周期：
 * 1. 注册曲线模板
 * 2. 验证曲线模板
 * 3. 解析曲线依赖
 * 4. 提供曲线查找功能
 */
export class CurveRegistry {
  private templates: Map<string, CurveTemplate> = new Map()
  private resolvedCurves: Map<string, ResolvedCurve> = new Map()
  
  /**
   * 注册曲线模板
   * 
   * @param template - 曲线模板
   * @throws {Error} 如果 ID 已存在
   */
  register(template: CurveTemplate): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Curve with id "${template.id}" already exists`)
    }
    this.templates.set(template.id, template)
  }
  
  /**
   * 批量注册曲线模板
   * 
   * @param templates - 曲线模板数组
   */
  registerAll(templates: CurveTemplate[]): void {
    for (const template of templates) {
      this.register(template)
    }
  }
  
  /**
   * 获取曲线模板
   * 
   * @param id - 曲线 ID
   * @returns 曲线模板，若不存在则返回 undefined
   */
  getTemplate(id: string): CurveTemplate | undefined {
    return this.templates.get(id)
  }
  
  /**
   * 获取解析后的曲线
   * 
   * @param id - 曲线 ID
   * @returns 解析后的曲线，若不存在则返回 undefined
   */
  getResolvedCurve(id: string): ResolvedCurve | undefined {
    return this.resolvedCurves.get(id)
  }
  
  /**
   * 检查曲线是否存在
   * 
   * @param id - 曲线 ID
   * @returns 是否存在
   */
  has(id: string): boolean {
    return this.templates.has(id)
  }
  
  /**
   * 获取所有曲线模板
   * 
   * @returns 曲线模板数组
   */
  getAllTemplates(): CurveTemplate[] {
    return Array.from(this.templates.values())
  }
  
  /**
   * 获取所有解析后的曲线
   * 
   * @returns 解析后的曲线数组
   */
  getAllResolvedCurves(): ResolvedCurve[] {
    return Array.from(this.resolvedCurves.values())
  }
  
  /**
   * 验证所有曲线模板
   * 
   * @returns 验证结果
   */
  validate(): CurveTemplateValidation {
    const errors: string[] = []
    const warnings: string[] = []
    
    // 检查每个模板
    for (const [id, template] of this.templates) {
      // 检查派生曲线的依赖是否存在
      if (template.type === 'derivedMR' || template.type === 'derivedMFC') {
        const sourceId = template.fromCurve
        if (!this.templates.has(sourceId)) {
          errors.push(`Curve "${id}" depends on non-existent curve "${sourceId}"`)
        }
      }
      
      // 检查线性曲线的斜率
      if (template.type === 'linear') {
        if (template.slope === 0) {
          warnings.push(`Curve "${id}" has zero slope (horizontal line). Consider using "horizontal" type.`)
        }
      }
      
      // 检查 U 形曲线的最低点
      if (template.type === 'uShape') {
        if (template.minimum.x < 0 || template.minimum.y < 0) {
          warnings.push(`Curve "${id}" has minimum point in negative quadrant`)
        }
      }
    }
    
    // 检查循环依赖
    const cycleErrors = this.checkCircularDependencies()
    errors.push(...cycleErrors)
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * 检查循环依赖
   * 
   * @returns 循环依赖错误列表
   */
  private checkCircularDependencies(): string[] {
    const errors: string[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const checkCycle = (id: string): boolean => {
      visited.add(id)
      recursionStack.add(id)
      
      const template = this.templates.get(id)
      if (template) {
        if (template.type === 'derivedMR' || template.type === 'derivedMFC') {
          const depId = template.fromCurve
          if (recursionStack.has(depId)) {
            errors.push(`Circular dependency detected: ${id} -> ${depId}`)
            return true
          }
          if (!visited.has(depId)) {
            checkCycle(depId)
          }
        }
      }
      
      recursionStack.delete(id)
      return false
    }
    
    for (const id of this.templates.keys()) {
      if (!visited.has(id)) {
        checkCycle(id)
      }
    }
    
    return errors
  }
  
  /**
   * 解析所有曲线
   * 
   * 按依赖顺序解析曲线，先解析基础曲线，再解析派生曲线。
   * 
   * @returns 解析后的曲线映射
   */
  resolve(): Map<string, ResolvedCurve> {
    const templates = this.getAllTemplates()
    this.resolvedCurves = resolveCurves(templates)
    return this.resolvedCurves
  }
  
  /**
   * 清空注册表
   */
  clear(): void {
    this.templates.clear()
    this.resolvedCurves.clear()
  }
  
  /**
   * 获取曲线数量
   * 
   * @returns 曲线数量
   */
  get size(): number {
    return this.templates.size
  }
}

/**
 * 创建曲线注册表
 * 
 * @param templates - 可选的初始曲线模板数组
 * @returns 曲线注册表实例
 */
export function createCurveRegistry(templates?: CurveTemplate[]): CurveRegistry {
  const registry = new CurveRegistry()
  if (templates) {
    registry.registerAll(templates)
  }
  return registry
}
