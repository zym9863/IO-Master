import { ref, computed, onUnmounted } from 'vue'
import { animationController, performanceMonitor, utils } from '../utils/animations'

// I/O模拟器状态管理
export function useIOSimulator() {
  // 基础状态
  const selectedMode = ref('polling')
  const isSimulating = ref(false)
  const simulationSpeed = ref(1) // 1x, 2x, 0.5x
  
  // CPU状态
  const cpuStatus = ref('idle')
  const cpuActivity = ref('等待指令')
  const programCounter = ref('0x1000')
  const cpuUtilization = ref(0)
  
  // 组件状态
  const componentStates = ref({
    controller: { active: false, status: '就绪', data: '无' },
    device: { active: false, status: '空闲', data: '无数据' },
    dma: { active: false, sourceAddr: '0x2000', targetAddr: '0x3000', count: 1024 },
    memory: Array(8).fill(null).map(() => ({ data: '', active: false }))
  })
  
  // 性能指标
  const performanceMetrics = ref({
    transferEfficiency: 0,
    responseTime: 0,
    throughput: 0
  })
  
  // 模拟日志
  const simulationLogs = ref<Array<{
    id: string
    timestamp: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }>>([])
  
  // 动画状态
  const animationStates = ref({
    showPollingFlow: false,
    showInterruptFlow: false,
    showDmaFlow: false,
    dataFlowActive: false
  })
  
  // 计算属性
  const currentModeConfig = computed(() => {
    const configs = {
      polling: {
        name: '轮询模式',
        description: 'CPU不断查询I/O设备状态，效率较低但实现简单',
        efficiency: 30,
        cpuUsage: 90,
        responseTime: 'high'
      },
      interrupt: {
        name: '中断模式', 
        description: 'I/O设备主动通知CPU，提高了CPU利用率',
        efficiency: 85,
        cpuUsage: 20,
        responseTime: 'medium'
      },
      dma: {
        name: 'DMA模式',
        description: 'DMA控制器直接访问内存，CPU几乎不参与',
        efficiency: 95,
        cpuUsage: 10,
        responseTime: 'low'
      }
    }
    return configs[selectedMode.value as keyof typeof configs]
  })
  
  const simulationProgress = computed(() => {
    if (!isSimulating.value) return 0
    // 根据当前模拟状态计算进度
    return Math.min(100, (Date.now() - simulationStartTime.value) / 10000 * 100)
  })
  
  // 内部状态
  const simulationStartTime = ref(0)
  const currentSimulationStep = ref(0)
  const simulationSteps = ref<string[]>([])
  
  // 方法
  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const log = {
      id: utils.generateId(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }
    simulationLogs.value.push(log)
    
    // 限制日志数量
    if (simulationLogs.value.length > 20) {
      simulationLogs.value.shift()
    }
  }
  
  const updatePerformanceMetrics = () => {
    const config = currentModeConfig.value
    performanceMetrics.value = {
      transferEfficiency: config.efficiency,
      responseTime: config.responseTime === 'low' ? 100 : config.responseTime === 'medium' ? 200 : 500,
      throughput: config.efficiency * 10
    }
    cpuUtilization.value = config.cpuUsage
  }
  
  /**
   * 重置模拟器到干净的初始状态，确保组件、动画与性能指标无残留。
   */
  const resetSimulation = () => {
    isSimulating.value = false
    currentSimulationStep.value = 0
    simulationStartTime.value = 0
    
    // 重置组件状态
    componentStates.value.controller.active = false
    componentStates.value.controller.status = '就绪'
    componentStates.value.controller.data = '无'
    componentStates.value.device.active = false
    componentStates.value.device.status = '空闲'
    componentStates.value.device.data = '无数据'
    componentStates.value.dma.active = false
    componentStates.value.dma.sourceAddr = '0x2000'
    componentStates.value.dma.targetAddr = '0x3000'
    componentStates.value.dma.count = 1024
    componentStates.value.memory.forEach(block => {
      block.data = ''
      block.active = false
    })
    
    // 重置动画状态
    Object.keys(animationStates.value).forEach(key => {
      animationStates.value[key as keyof typeof animationStates.value] = false
    })
    
    // 重置性能指标
    performanceMetrics.value = {
      transferEfficiency: 0,
      responseTime: 0,
      throughput: 0
    }
    
    cpuStatus.value = 'idle'
    cpuActivity.value = '等待指令'
    cpuUtilization.value = 0
    
    // 停止所有动画
    animationController.stopAllAnimations()
    
    // 清空日志
    simulationLogs.value = []
    
    addLog('模拟器已重置', 'info')
  }
  
  /**
   * 启动当前模式的模拟流程，并在开始前同步初始状态以避免脏数据。
   */
  const startSimulation = async () => {
    if (isSimulating.value) return
    
    performanceMonitor.startTiming('simulation')
    isSimulating.value = true
    simulationStartTime.value = Date.now()
    currentSimulationStep.value = 0
    
    // 运行前同步初始状态，确保重复启动时数据一致
    componentStates.value.controller.active = false
    componentStates.value.controller.status = '就绪'
    componentStates.value.controller.data = '无'
    componentStates.value.device.active = false
    componentStates.value.device.status = '空闲'
    componentStates.value.device.data = '无数据'
    componentStates.value.dma.active = false
    componentStates.value.dma.sourceAddr = '0x2000'
    componentStates.value.dma.targetAddr = '0x3000'
    componentStates.value.dma.count = 1024
    componentStates.value.memory.forEach(block => {
      block.data = ''
      block.active = false
    })
    Object.keys(animationStates.value).forEach(key => {
      animationStates.value[key as keyof typeof animationStates.value] = false
    })
    
    addLog(`开始${currentModeConfig.value.name}模拟`, 'info')
    updatePerformanceMetrics()
    
    try {
      switch (selectedMode.value) {
        case 'polling':
          await simulatePolling()
          break
        case 'interrupt':
          await simulateInterrupt()
          break
        case 'dma':
          await simulateDMA()
          break
      }
      
      const duration = performanceMonitor.endTiming('simulation')
      addLog(`模拟完成，耗时 ${utils.formatTime(duration)}`, 'success')
    } catch (error) {
      addLog(`模拟出错: ${error}`, 'error')
    } finally {
      isSimulating.value = false
    }
  }
  
  const simulatePolling = async () => {
    const steps = [
      '初始化CPU状态',
      '开始轮询循环',
      '检查设备状态',
      '设备未就绪，继续轮询',
      '设备就绪，开始数据传输',
      '数据传输完成'
    ]
    simulationSteps.value = steps
    
    cpuStatus.value = 'busy'
    cpuActivity.value = '轮询I/O状态'
    
    // 模拟多次轮询
    for (let i = 0; i < 5; i++) {
      currentSimulationStep.value = i + 1
      animationStates.value.showPollingFlow = true
      componentStates.value.controller.active = true
      
      addLog(`第${i + 1}次轮询 - 设备未就绪`, 'warning')
      await utils.delay(1000 / simulationSpeed.value)
      
      animationStates.value.showPollingFlow = false
      componentStates.value.controller.active = false
      await utils.delay(500 / simulationSpeed.value)
    }
    
    // 设备就绪
    componentStates.value.device.active = true
    componentStates.value.device.status = '就绪'
    componentStates.value.device.data = 'Data_001'
    addLog('设备就绪，开始数据传输', 'success')
    
    // 数据传输
    animationStates.value.showPollingFlow = true
    componentStates.value.controller.active = true
    componentStates.value.controller.data = 'Data_001'
    await utils.delay(1000 / simulationSpeed.value)
    
    // 数据到达内存
    componentStates.value.memory[0].data = 'Data_001'
    componentStates.value.memory[0].active = true
    addLog('数据传输完成', 'success')
    
    cpuStatus.value = 'idle'
    cpuActivity.value = '处理其他任务'
  }
  
  const simulateInterrupt = async () => {
    cpuStatus.value = 'idle'
    cpuActivity.value = '执行其他任务'
    addLog('CPU执行其他任务，等待中断', 'info')
    
    await utils.delay(2000 / simulationSpeed.value)
    
    // 设备准备好数据
    componentStates.value.device.active = true
    componentStates.value.device.status = '就绪'
    componentStates.value.device.data = 'Data_002'
    addLog('I/O设备准备就绪，发送中断请求', 'info')
    
    // 中断信号
    animationStates.value.showInterruptFlow = true
    await utils.delay(500 / simulationSpeed.value)
    
    // CPU响应中断
    cpuStatus.value = 'busy'
    cpuActivity.value = '处理中断'
    addLog('CPU响应中断，开始数据传输', 'success')
    
    componentStates.value.controller.active = true
    componentStates.value.controller.data = 'Data_002'
    await utils.delay(1000 / simulationSpeed.value)
    
    // 数据传输完成
    componentStates.value.memory[1].data = 'Data_002'
    componentStates.value.memory[1].active = true
    addLog('数据传输完成，返回主程序', 'success')
    
    cpuStatus.value = 'idle'
    cpuActivity.value = '继续执行主程序'
    animationStates.value.showInterruptFlow = false
  }
  
  const simulateDMA = async () => {
    cpuStatus.value = 'busy'
    cpuActivity.value = '配置DMA'
    addLog('CPU配置DMA控制器', 'info')
    
    // 配置DMA
    componentStates.value.dma.active = true
    await utils.delay(1000 / simulationSpeed.value)
    
    addLog('DMA配置完成，CPU继续执行其他任务', 'success')
    cpuStatus.value = 'idle'
    cpuActivity.value = '执行其他任务'
    
    // 设备准备数据
    componentStates.value.device.active = true
    componentStates.value.device.status = '就绪'
    componentStates.value.device.data = 'Data_003'
    addLog('I/O设备准备就绪，DMA开始传输', 'info')
    
    // DMA直接传输
    animationStates.value.showDmaFlow = true
    componentStates.value.controller.active = true
    
    for (let i = 0; i < 3; i++) {
      await utils.delay(800 / simulationSpeed.value)
      componentStates.value.memory[i + 2].data = `Data_00${i + 3}`
      componentStates.value.memory[i + 2].active = true
      componentStates.value.dma.count -= 256
      addLog(`DMA传输进度: ${((i + 1) / 3 * 100).toFixed(0)}%`, 'info')
    }
    
    addLog('DMA传输完成，通知CPU', 'success')
    animationStates.value.showDmaFlow = false
    componentStates.value.dma.active = false
  }
  
  const changeMode = (mode: string) => {
    if (!isSimulating.value) {
      selectedMode.value = mode
      resetSimulation()
      addLog(`切换到${currentModeConfig.value.name}`, 'info')
    }
  }
  
  const setSimulationSpeed = (speed: number) => {
    simulationSpeed.value = speed
    addLog(`模拟速度设置为 ${speed}x`, 'info')
  }
  
  // 清理函数
  onUnmounted(() => {
    animationController.stopAllAnimations()
    performanceMonitor.clearMetrics()
  })
  
  return {
    // 状态
    selectedMode,
    isSimulating,
    simulationSpeed,
    cpuStatus,
    cpuActivity,
    programCounter,
    cpuUtilization,
    componentStates,
    performanceMetrics,
    simulationLogs,
    animationStates,
    simulationProgress,
    
    // 计算属性
    currentModeConfig,
    
    // 方法
    startSimulation,
    resetSimulation,
    changeMode,
    setSimulationSpeed,
    addLog
  }
}
