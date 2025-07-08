// 动画工具类
export class AnimationController {
  private animations: Map<string, Animation> = new Map()
  private timers: Map<string, number> = new Map()

  // 创建脉冲动画
  createPulseAnimation(element: HTMLElement, duration: number = 1000): Animation {
    const keyframes = [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0.7, transform: 'scale(1.05)' },
      { opacity: 1, transform: 'scale(1)' }
    ]
    
    return element.animate(keyframes, {
      duration,
      iterations: Infinity,
      easing: 'ease-in-out'
    })
  }

  // 创建数据流动画
  createDataFlowAnimation(path: SVGPathElement, duration: number = 2000): Animation {
    const pathLength = path.getTotalLength()
    
    const keyframes = [
      { strokeDasharray: `0 ${pathLength}`, strokeDashoffset: 0 },
      { strokeDasharray: `${pathLength} 0`, strokeDashoffset: 0 }
    ]
    
    return path.animate(keyframes, {
      duration,
      iterations: Infinity,
      easing: 'linear'
    })
  }

  // 创建高亮动画
  createHighlightAnimation(element: HTMLElement, color: string = '#f39c12'): Animation {
    const keyframes = [
      { boxShadow: `0 0 0 rgba(243, 156, 18, 0)` },
      { boxShadow: `0 0 20px rgba(243, 156, 18, 0.8)` },
      { boxShadow: `0 0 0 rgba(243, 156, 18, 0)` }
    ]
    
    return element.animate(keyframes, {
      duration: 1000,
      iterations: 3,
      easing: 'ease-in-out'
    })
  }

  // 创建滑入动画
  createSlideInAnimation(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'left'): Animation {
    const transforms = {
      left: ['translateX(-100%)', 'translateX(0)'],
      right: ['translateX(100%)', 'translateX(0)'],
      up: ['translateY(-100%)', 'translateY(0)'],
      down: ['translateY(100%)', 'translateY(0)']
    }
    
    const keyframes = [
      { transform: transforms[direction][0], opacity: 0 },
      { transform: transforms[direction][1], opacity: 1 }
    ]
    
    return element.animate(keyframes, {
      duration: 500,
      easing: 'ease-out',
      fill: 'forwards'
    })
  }

  // 启动动画
  startAnimation(id: string, animation: Animation): void {
    this.stopAnimation(id)
    this.animations.set(id, animation)
    animation.play()
  }

  // 停止动画
  stopAnimation(id: string): void {
    const animation = this.animations.get(id)
    if (animation) {
      animation.cancel()
      this.animations.delete(id)
    }
    
    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(id)
    }
  }

  // 停止所有动画
  stopAllAnimations(): void {
    this.animations.forEach(animation => animation.cancel())
    this.animations.clear()
    
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
  }

  // 延迟执行动画
  delayedAnimation(id: string, callback: () => void, delay: number): void {
    this.stopAnimation(id)
    const timer = setTimeout(callback, delay)
    this.timers.set(id, timer)
  }

  // 序列动画
  async sequenceAnimations(animations: Array<{ id: string, animation: () => Animation, delay?: number }>): Promise<void> {
    for (const { id, animation, delay = 0 } of animations) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      const anim = animation()
      this.startAnimation(id, anim)
      
      // 等待动画完成
      await new Promise(resolve => {
        anim.addEventListener('finish', resolve)
      })
    }
  }
}

// 状态管理类
export class StateManager {
  private state: Map<string, any> = new Map()
  private listeners: Map<string, Array<(value: any) => void>> = new Map()

  // 设置状态
  setState(key: string, value: any): void {
    const oldValue = this.state.get(key)
    this.state.set(key, value)
    
    // 通知监听器
    const keyListeners = this.listeners.get(key)
    if (keyListeners && oldValue !== value) {
      keyListeners.forEach(listener => listener(value))
    }
  }

  // 获取状态
  getState(key: string): any {
    return this.state.get(key)
  }

  // 监听状态变化
  subscribe(key: string, listener: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }
    
    this.listeners.get(key)!.push(listener)
    
    // 返回取消订阅函数
    return () => {
      const keyListeners = this.listeners.get(key)
      if (keyListeners) {
        const index = keyListeners.indexOf(listener)
        if (index > -1) {
          keyListeners.splice(index, 1)
        }
      }
    }
  }

  // 批量更新状态
  batchUpdate(updates: Record<string, any>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.setState(key, value)
    })
  }

  // 重置所有状态
  reset(): void {
    this.state.clear()
  }
}

// 性能监控类
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private startTimes: Map<string, number> = new Map()

  // 开始计时
  startTiming(label: string): void {
    this.startTimes.set(label, performance.now())
  }

  // 结束计时
  endTiming(label: string): number {
    const startTime = this.startTimes.get(label)
    if (!startTime) {
      console.warn(`No start time found for label: ${label}`)
      return 0
    }
    
    const duration = performance.now() - startTime
    this.startTimes.delete(label)
    
    // 记录指标
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(duration)
    
    return duration
  }

  // 获取平均性能
  getAverageTime(label: string): number {
    const times = this.metrics.get(label)
    if (!times || times.length === 0) return 0
    
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  // 获取性能报告
  getReport(): Record<string, { average: number, count: number, total: number }> {
    const report: Record<string, { average: number, count: number, total: number }> = {}
    
    this.metrics.forEach((times, label) => {
      const total = times.reduce((sum, time) => sum + time, 0)
      report[label] = {
        average: total / times.length,
        count: times.length,
        total
      }
    })
    
    return report
  }

  // 清除指标
  clearMetrics(): void {
    this.metrics.clear()
    this.startTimes.clear()
  }
}

// 工具函数
export const utils = {
  // 延迟函数
  delay: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 格式化时间
  formatTime: (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  },
  
  // 生成随机ID
  generateId: (): string => Math.random().toString(36).substr(2, 9),
  
  // 深拷贝
  deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
  
  // 节流函数
  throttle: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: number | null = null
    let lastExecTime = 0
    
    return ((...args: any[]) => {
      const currentTime = Date.now()
      
      if (currentTime - lastExecTime > delay) {
        func(...args)
        lastExecTime = currentTime
      } else {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func(...args)
          lastExecTime = Date.now()
        }, delay - (currentTime - lastExecTime))
      }
    }) as T
  },
  
  // 防抖函数
  debounce: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: number | null = null
    
    return ((...args: any[]) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }) as T
  }
}

// 导出单例实例
export const animationController = new AnimationController()
export const stateManager = new StateManager()
export const performanceMonitor = new PerformanceMonitor()
