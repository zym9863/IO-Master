import { ref, computed, watch, onUnmounted } from 'vue'
import { animationController } from '../utils/animations'

// 中断处理步骤定义
const INTERRUPT_STEPS = [
  {
    id: 'initial',
    title: '初始状态',
    description: 'CPU正在执行主程序，I/O设备准备发送中断请求',
    details: [
      'CPU正在执行地址0x1000处的指令',
      '程序计数器PC指向当前执行的指令',
      '状态字PSW包含当前CPU状态信息',
      'I/O设备准备好数据，即将发送中断请求'
    ]
  },
  {
    id: 'request',
    title: '中断请求(IRQ)',
    description: 'I/O设备向CPU发送中断请求信号',
    details: [
      'I/O设备通过IRQ线向中断控制器发送中断请求',
      '中断控制器接收到中断请求，设置IRR寄存器',
      '如果中断未被屏蔽，控制器向CPU发送INTR信号',
      'CPU在执行完当前指令后检查中断请求'
    ]
  },
  {
    id: 'response',
    title: '中断响应',
    description: 'CPU响应中断请求，准备处理中断',
    details: [
      'CPU完成当前指令的执行',
      'CPU检查中断标志位，确认可以响应中断',
      'CPU向中断控制器发送中断确认信号(INTA)',
      '中断控制器返回中断类型码给CPU'
    ]
  },
  {
    id: 'save_context',
    title: '现场保护',
    description: 'CPU保存当前程序的执行现场到堆栈',
    details: [
      '首先将标志寄存器PSW压入堆栈',
      '然后将程序计数器PC压入堆栈',
      '保存其他重要寄存器(AX, BX等)到堆栈',
      '堆栈指针SP相应调整，指向栈顶'
    ]
  },
  {
    id: 'find_isr',
    title: '寻找中断服务程序',
    description: 'CPU根据中断类型码查找中断向量表',
    details: [
      '使用中断类型码作为索引访问中断向量表',
      '从中断向量表中读取中断服务程序的入口地址',
      '中断向量表通常位于内存的固定位置',
      '每个中断类型对应一个唯一的服务程序地址'
    ]
  },
  {
    id: 'execute_isr',
    title: '执行中断服务程序',
    description: 'CPU跳转到中断服务程序并开始执行',
    details: [
      '将PC设置为中断服务程序的入口地址',
      '开始执行中断服务程序的指令',
      '处理I/O设备的数据传输请求',
      '执行设备相关的特定操作'
    ]
  },
  {
    id: 'restore_context',
    title: '现场恢复',
    description: '中断服务程序执行完毕，恢复被中断程序的现场',
    details: [
      '中断服务程序执行IRET指令',
      '从堆栈中弹出保存的寄存器值',
      '首先恢复通用寄存器(BX, AX等)',
      '然后恢复程序计数器PC和状态字PSW'
    ]
  },
  {
    id: 'return',
    title: '中断返回',
    description: 'CPU返回到被中断的主程序继续执行',
    details: [
      'PC恢复到中断前的下一条指令地址',
      'CPU状态完全恢复到中断前的状态',
      '继续执行被中断的主程序',
      '中断处理过程完全结束'
    ]
  }
]

export function useInterruptDemo() {
  // 基础状态
  const currentStep = ref(1)
  const isAutoPlaying = ref(false)
  const autoPlaySpeed = ref(3000) // 毫秒
  const autoPlayTimer = ref<number | null>(null)
  
  // CPU状态
  const cpuState = ref('执行主程序')
  const programCounter = ref('0x1000')
  const statusWord = ref('0x0200')
  const registerAX = ref('0x1234')
  const registerBX = ref('0x5678')
  
  // 高亮状态
  const highlights = ref({
    pc: false,
    psw: false,
    ax: false,
    bx: false
  })
  
  // 组件激活状态
  const componentActive = ref({
    cpu: true,
    ivt: false,
    stack: false,
    isr: false,
    device: false,
    pic: false
  })
  
  // I/O设备状态
  const deviceState = ref({
    status: '准备就绪',
    data: 'Data_001',
    requesting: false,
    interruptSignal: false
  })
  
  // 中断控制器状态
  const picState = ref({
    irr: '00000000',
    isr: '00000000',
    imr: '11111110'
  })
  
  // 信号流显示
  const signalFlow = ref({
    showInterruptRequest: false,
    showInterruptResponse: false
  })
  
  // 堆栈状态
  const stackState = ref({
    pointer: '0xFFFF',
    items: [] as Array<{value: string, highlight: boolean, isNew: boolean}>
  })
  
  // 中断向量表
  const interruptVectors = ref([
    { num: '00', address: '0x0000', highlight: false },
    { num: '01', address: '0x0004', highlight: false },
    { num: '02', address: '0x0008', highlight: false },
    { num: '03', address: '0x000C', highlight: false },
    { num: '21', address: '0x2000', highlight: false },
  ])
  
  // 程序指令
  const programInstructions = ref([
    { address: '0x1000', instruction: 'MOV AX, 1234h', current: true, executed: false },
    { address: '0x1003', instruction: 'ADD BX, AX', current: false, executed: false },
    { address: '0x1005', instruction: 'MOV [SI], BX', current: false, executed: false },
    { address: '0x1008', instruction: 'INC SI', current: false, executed: false },
  ])
  
  // 中断服务程序指令
  const isrInstructions = ref([
    { address: '0x2000', instruction: 'PUSH AX', current: false, executed: false },
    { address: '0x2001', instruction: 'PUSH BX', current: false, executed: false },
    { address: '0x2002', instruction: 'IN AL, 60h', current: false, executed: false },
    { address: '0x2004', instruction: 'MOV [BUFFER], AL', current: false, executed: false },
    { address: '0x2007', instruction: 'POP BX', current: false, executed: false },
    { address: '0x2008', instruction: 'POP AX', current: false, executed: false },
    { address: '0x2009', instruction: 'IRET', current: false, executed: false },
  ])
  
  // 寄存器变化记录
  const registerChanges = ref<Array<{
    step: number
    description: string
    type: 'request' | 'response' | 'save' | 'restore' | 'lookup' | 'execute' | 'return'
    timestamp: string
  }>>([])
  
  // 计算属性
  const totalSteps = computed(() => INTERRUPT_STEPS.length)
  
  const currentStepInfo = computed(() => {
    return INTERRUPT_STEPS[currentStep.value - 1] || INTERRUPT_STEPS[0]
  })
  
  const progressPercentage = computed(() => {
    return (currentStep.value / totalSteps.value) * 100
  })
  
  const canGoNext = computed(() => currentStep.value < totalSteps.value)
  const canGoPrevious = computed(() => currentStep.value > 1)
  
  // 方法
  const nextStep = () => {
    if (canGoNext.value) {
      currentStep.value++
    }
  }
  
  const previousStep = () => {
    if (canGoPrevious.value) {
      currentStep.value--
    }
  }
  
  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps.value) {
      currentStep.value = step
    }
  }
  
  const addRegisterChange = (description: string, type: string) => {
    const change = {
      step: currentStep.value,
      description,
      type: type as any,
      timestamp: new Date().toLocaleTimeString()
    }
    registerChanges.value.push(change)
    
    // 限制记录数量
    if (registerChanges.value.length > 10) {
      registerChanges.value.shift()
    }
  }
  
  const resetAllStates = () => {
    // 重置高亮
    Object.keys(highlights.value).forEach(key => {
      highlights.value[key as keyof typeof highlights.value] = false
    })
    
    // 重置组件状态
    Object.keys(componentActive.value).forEach(key => {
      componentActive.value[key as keyof typeof componentActive.value] = false
    })
    componentActive.value.cpu = true
    
    // 重置设备状态
    deviceState.value.requesting = false
    deviceState.value.interruptSignal = false
    
    // 重置信号流
    signalFlow.value.showInterruptRequest = false
    signalFlow.value.showInterruptResponse = false
    
    // 重置指令状态
    programInstructions.value.forEach(instr => {
      instr.current = false
      instr.executed = false
    })
    programInstructions.value[0].current = true
    
    isrInstructions.value.forEach(instr => {
      instr.current = false
      instr.executed = false
    })
    
    // 重置向量表高亮
    interruptVectors.value.forEach(vector => {
      vector.highlight = false
    })
    
    // 重置堆栈
    stackState.value.items = []
    stackState.value.pointer = '0xFFFF'
  }
  
  const executeStepActions = () => {
    resetAllStates()
    
    const stepId = currentStepInfo.value.id
    
    switch (stepId) {
      case 'initial':
        setupInitialState()
        break
      case 'request':
        setupInterruptRequest()
        break
      case 'response':
        setupInterruptResponse()
        break
      case 'save_context':
        setupContextSave()
        break
      case 'find_isr':
        setupFindISR()
        break
      case 'execute_isr':
        setupExecuteISR()
        break
      case 'restore_context':
        setupContextRestore()
        break
      case 'return':
        setupInterruptReturn()
        break
    }
  }
  
  const setupInitialState = () => {
    cpuState.value = '执行主程序'
    deviceState.value.status = '准备就绪'
    componentActive.value.device = true
  }
  
  const setupInterruptRequest = () => {
    deviceState.value.requesting = true
    deviceState.value.interruptSignal = true
    deviceState.value.status = '发送中断请求'
    signalFlow.value.showInterruptRequest = true
    componentActive.value.pic = true
    picState.value.irr = '00000010'
    
    addRegisterChange('I/O设备发送IRQ信号', 'request')
  }
  
  const setupInterruptResponse = () => {
    signalFlow.value.showInterruptResponse = true
    cpuState.value = '响应中断'
    picState.value.isr = '00000010'
    
    addRegisterChange('CPU响应中断，发送INTA信号', 'response')
  }
  
  const setupContextSave = () => {
    componentActive.value.stack = true
    highlights.value.psw = true
    highlights.value.pc = true
    highlights.value.ax = true
    highlights.value.bx = true
    
    // 模拟压栈过程
    stackState.value.items = [
      { value: 'PSW: 0x0200', highlight: true, isNew: true },
      { value: 'PC: 0x1000', highlight: true, isNew: true },
      { value: 'AX: 0x1234', highlight: true, isNew: true },
      { value: 'BX: 0x5678', highlight: true, isNew: true }
    ]
    stackState.value.pointer = '0xFFFB'
    cpuState.value = '保存现场'
    
    addRegisterChange('寄存器内容压入堆栈', 'save')
  }
  
  const setupFindISR = () => {
    componentActive.value.ivt = true
    interruptVectors.value[4].highlight = true // 中断21h
    cpuState.value = '查找中断向量'
    
    addRegisterChange('查找中断向量表，获取ISR地址', 'lookup')
  }
  
  const setupExecuteISR = () => {
    componentActive.value.isr = true
    isrInstructions.value[0].current = true
    programCounter.value = '0x2000'
    cpuState.value = '执行中断服务程序'
    
    addRegisterChange('PC跳转到ISR入口地址', 'execute')
  }
  
  const setupContextRestore = () => {
    componentActive.value.stack = true
    isrInstructions.value[6].current = true // IRET指令
    
    // 模拟出栈过程
    stackState.value.items.forEach(item => {
      item.highlight = true
      item.isNew = false
    })
    stackState.value.pointer = '0xFFFF'
    cpuState.value = '恢复现场'
    
    addRegisterChange('从堆栈恢复寄存器内容', 'restore')
  }
  
  const setupInterruptReturn = () => {
    programCounter.value = '0x1003'
    programInstructions.value[0].executed = true
    programInstructions.value[1].current = true
    cpuState.value = '继续执行主程序'
    stackState.value.items = []
    
    addRegisterChange('PC恢复，继续执行主程序', 'return')
  }
  
  const startAutoPlay = () => {
    if (autoPlayTimer.value) clearInterval(autoPlayTimer.value)
    
    autoPlayTimer.value = setInterval(() => {
      if (canGoNext.value) {
        nextStep()
      } else {
        stopAutoPlay()
      }
    }, autoPlaySpeed.value)
    
    isAutoPlaying.value = true
  }
  
  const stopAutoPlay = () => {
    if (autoPlayTimer.value) {
      clearInterval(autoPlayTimer.value)
      autoPlayTimer.value = null
    }
    isAutoPlaying.value = false
  }
  
  const toggleAutoPlay = () => {
    if (isAutoPlaying.value) {
      stopAutoPlay()
    } else {
      startAutoPlay()
    }
  }
  
  const resetDemo = () => {
    stopAutoPlay()
    currentStep.value = 1
    registerChanges.value = []
  }
  
  const setAutoPlaySpeed = (speed: number) => {
    autoPlaySpeed.value = speed
    if (isAutoPlaying.value) {
      stopAutoPlay()
      startAutoPlay()
    }
  }
  
  // 监听步骤变化
  watch(currentStep, () => {
    executeStepActions()
  }, { immediate: true })
  
  // 清理函数
  onUnmounted(() => {
    stopAutoPlay()
    animationController.stopAllAnimations()
  })
  
  return {
    // 状态
    currentStep,
    isAutoPlaying,
    autoPlaySpeed,
    cpuState,
    programCounter,
    statusWord,
    registerAX,
    registerBX,
    highlights,
    componentActive,
    deviceState,
    picState,
    signalFlow,
    stackState,
    interruptVectors,
    programInstructions,
    isrInstructions,
    registerChanges,
    
    // 计算属性
    totalSteps,
    currentStepInfo,
    progressPercentage,
    canGoNext,
    canGoPrevious,
    
    // 方法
    nextStep,
    previousStep,
    goToStep,
    toggleAutoPlay,
    resetDemo,
    setAutoPlaySpeed
  }
}
