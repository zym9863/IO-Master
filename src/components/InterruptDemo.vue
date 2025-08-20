<template>
  <div class="interrupt-demo">
    <div class="demo-header">
      <h2>中断处理流程交互式演练</h2>
      <p class="description">
        通过分步演示深入理解中断处理的完整流程，从中断请求到现场恢复的每一个细节
      </p>
    </div>

    <div class="demo-container">
      <!-- 系统架构图 -->
      <div class="system-view">
        <!-- CPU -->
        <div class="component cpu" :class="{ active: cpuActive }">
          <div class="component-header">
            <h3>CPU</h3>
            <div class="cpu-state">{{ cpuState }}</div>
          </div>
          <div class="cpu-registers">
            <div class="register" :class="{ highlight: highlightPC }">
              PC: {{ programCounter }}
            </div>
            <div class="register" :class="{ highlight: highlightPSW }">
              PSW: {{ statusWord }}
            </div>
            <div class="register" :class="{ highlight: highlightAX }">
              AX: {{ registerAX }}
            </div>
            <div class="register" :class="{ highlight: highlightBX }">
              BX: {{ registerBX }}
            </div>
          </div>
        </div>

        <!-- 内存区域 -->
        <div class="component memory">
          <div class="component-header">
            <h3>内存</h3>
          </div>
          <div class="memory-sections">
            <!-- 中断向量表 -->
            <div class="memory-section interrupt-vector-table" :class="{ active: ivtActive }">
              <h4>中断向量表</h4>
              <div class="vector-entry" v-for="(vector, index) in interruptVectors" :key="index" 
                   :class="{ highlight: vector.highlight }">
                <span class="vector-num">{{ vector.num }}</span>
                <span class="vector-addr">{{ vector.address }}</span>
              </div>
            </div>

            <!-- 堆栈区域 -->
            <div class="memory-section stack" :class="{ active: stackActive }">
              <h4>堆栈</h4>
              <div class="stack-pointer">SP: {{ stackPointer }}</div>
              <div class="stack-content">
                <div v-for="(item, index) in stackItems" :key="index" 
                     class="stack-item" :class="{ highlight: item.highlight, new: item.isNew }">
                  {{ item.value }}
                </div>
              </div>
            </div>

            <!-- 程序区域 -->
            <div class="memory-section program-area">
              <h4>程序区域</h4>
              <div class="program-instruction" v-for="(instruction, index) in programInstructions" :key="index"
                   :class="{ current: instruction.current, executed: instruction.executed }">
                <span class="addr">{{ instruction.address }}</span>
                <span class="instr">{{ instruction.instruction }}</span>
              </div>
            </div>

            <!-- 中断服务程序 -->
            <div class="memory-section isr-area" :class="{ active: isrActive }">
              <h4>中断服务程序</h4>
              <div class="isr-instruction" v-for="(instruction, index) in isrInstructions" :key="index"
                   :class="{ current: instruction.current, executed: instruction.executed }">
                <span class="addr">{{ instruction.address }}</span>
                <span class="instr">{{ instruction.instruction }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- I/O设备 -->
        <div class="component io-device" :class="{ active: deviceActive, requesting: deviceRequesting }">
          <div class="component-header">
            <h3>I/O设备</h3>
            <div class="device-status">{{ deviceStatus }}</div>
          </div>
          <div class="device-content">
            <div class="interrupt-line" :class="{ active: interruptSignal }">
              IRQ信号: {{ interruptSignal ? '激活' : '无' }}
            </div>
            <div class="device-data">
              数据: {{ deviceData }}
            </div>
          </div>
        </div>

        <!-- 中断控制器 -->
        <div class="component interrupt-controller" :class="{ active: picActive }">
          <div class="component-header">
            <h3>中断控制器</h3>
          </div>
          <div class="pic-content">
            <div class="interrupt-request">
              IRR: {{ interruptRequestRegister }}
            </div>
            <div class="interrupt-service">
              ISR: {{ interruptServiceRegister }}
            </div>
            <div class="interrupt-mask">
              IMR: {{ interruptMaskRegister }}
            </div>
          </div>
        </div>

        <!-- 连接线和信号流 -->
        <svg class="signal-flow" viewBox="0 0 800 600">
          <!-- 中断请求线 -->
          <path v-if="showInterruptRequest" 
                class="signal-line interrupt-request-line"
                d="M 650 400 L 500 400 L 500 200 L 200 200"
                stroke="#e74c3c" stroke-width="3" fill="none">
            <animate attributeName="stroke-dasharray" values="0,10;10,0" dur="0.5s" repeatCount="indefinite"/>
          </path>
          
          <!-- 中断响应线 -->
          <path v-if="showInterruptResponse"
                class="signal-line interrupt-response-line" 
                d="M 200 220 L 500 220 L 500 420 L 650 420"
                stroke="#27ae60" stroke-width="3" fill="none">
            <animate attributeName="stroke-dasharray" values="0,10;10,0" dur="0.5s" repeatCount="indefinite"/>
          </path>
        </svg>
      </div>

      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="step-info">
          <h3>步骤 {{ currentStep }}/{{ totalSteps }}</h3>
          <h4>{{ currentStepInfo.title }}</h4>
          <p>{{ currentStepInfo.description }}</p>
        </div>

        <div class="step-controls">
          <button @click="previousStep" :disabled="currentStep <= 1" class="step-btn prev-btn">
            上一步
          </button>
          <button @click="nextStep" :disabled="currentStep >= totalSteps" class="step-btn next-btn">
            下一步
          </button>
        </div>

        <div class="auto-play-controls">
          <button @click="toggleAutoPlay" class="auto-play-btn" :class="{ active: isAutoPlaying }">
            {{ isAutoPlaying ? '暂停自动播放' : '自动播放' }}
          </button>
          <button @click="resetDemo" class="reset-btn">重置演示</button>
        </div>

        <div class="step-progress">
          <div class="progress-bar">
            <div class="progress" :style="{ width: (currentStep / totalSteps) * 100 + '%' }"></div>
          </div>
          <div class="step-indicators">
            <div v-for="step in totalSteps" :key="step" 
                 class="step-indicator" 
                 :class="{ active: step <= currentStep, current: step === currentStep }"
                 @click="goToStep(step)">
              {{ step }}
            </div>
          </div>
        </div>

        <div class="detailed-explanation">
          <h4>详细说明</h4>
          <div class="explanation-content">
            <div v-for="(point, index) in currentStepInfo.details" :key="index" class="explanation-point">
              • {{ point }}
            </div>
          </div>
        </div>

        <div class="register-monitor">
          <h4>寄存器变化监控</h4>
          <div class="register-changes">
            <div v-for="(change, index) in registerChanges" :key="index" 
                 class="register-change" :class="change.type">
              <span class="change-step">步骤{{ change.step }}:</span>
              <span class="change-desc">{{ change.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// 中断处理步骤定义
const interruptSteps = [
  {
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

// 响应式状态
const currentStep = ref(1)
const totalSteps = computed(() => interruptSteps.length)
const isAutoPlaying = ref(false)
const autoPlayTimer = ref<number | null>(null)

// CPU状态
const cpuActive = ref(true)
const cpuState = ref('执行主程序')
const programCounter = ref('0x1000')
const statusWord = ref('0x0200')
const registerAX = ref('0x1234')
const registerBX = ref('0x5678')

// 高亮状态
const highlightPC = ref(false)
const highlightPSW = ref(false)
const highlightAX = ref(false)
const highlightBX = ref(false)

// 内存组件状态
const ivtActive = ref(false)
const stackActive = ref(false)
const isrActive = ref(false)

// I/O设备状态
const deviceActive = ref(false)
const deviceRequesting = ref(false)
const deviceStatus = ref('准备就绪')
const deviceData = ref('Data_001')
const interruptSignal = ref(false)

// 中断控制器状态
const picActive = ref(false)
const interruptRequestRegister = ref('00000000')
const interruptServiceRegister = ref('00000000')
const interruptMaskRegister = ref('11111110')

// 信号流显示
const showInterruptRequest = ref(false)
const showInterruptResponse = ref(false)

// 堆栈
const stackPointer = ref('0xFFFF')
const stackItems = ref<Array<{value: string, highlight: boolean, isNew: boolean}>>([])

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
const registerChanges = ref<Array<{step: number, description: string, type: string}>>([])

// 计算属性
const currentStepInfo = computed(() => {
  return interruptSteps[currentStep.value - 1] || interruptSteps[0]
})

// 方法
const nextStep = () => {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++
    executeStep()
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    executeStep()
  }
}

const goToStep = (step: number) => {
  if (step >= 1 && step <= totalSteps.value) {
    currentStep.value = step
    executeStep()
  }
}

const toggleAutoPlay = () => {
  isAutoPlaying.value = !isAutoPlaying.value
  if (isAutoPlaying.value) {
    startAutoPlay()
  } else {
    stopAutoPlay()
  }
}

const startAutoPlay = () => {
  if (autoPlayTimer.value) clearInterval(autoPlayTimer.value)
  autoPlayTimer.value = setInterval(() => {
    if (currentStep.value < totalSteps.value) {
      nextStep()
    } else {
      stopAutoPlay()
    }
  }, 3000)
}

const stopAutoPlay = () => {
  isAutoPlaying.value = false
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

const resetDemo = () => {
  stopAutoPlay()
  currentStep.value = 1
  executeStep()
}

const executeStep = () => {
  // 重置所有状态
  resetAllStates()
  
  // 根据当前步骤设置状态
  switch (currentStep.value) {
    case 1: // 初始状态
      setupInitialState()
      break
    case 2: // 中断请求
      setupInterruptRequest()
      break
    case 3: // 中断响应
      setupInterruptResponse()
      break
    case 4: // 现场保护
      setupContextSave()
      break
    case 5: // 寻找中断服务程序
      setupFindISR()
      break
    case 6: // 执行中断服务程序
      setupExecuteISR()
      break
    case 7: // 现场恢复
      setupContextRestore()
      break
    case 8: // 中断返回
      setupInterruptReturn()
      break
  }
}

const resetAllStates = () => {
  // 重置高亮
  highlightPC.value = false
  highlightPSW.value = false
  highlightAX.value = false
  highlightBX.value = false
  
  // 重置组件状态
  ivtActive.value = false
  stackActive.value = false
  isrActive.value = false
  deviceRequesting.value = false
  picActive.value = false
  
  // 重置信号
  showInterruptRequest.value = false
  showInterruptResponse.value = false
  interruptSignal.value = false
  
  // 重置指令状态
  programInstructions.value.forEach(instr => {
    instr.current = false
    instr.executed = false
  })
  isrInstructions.value.forEach(instr => {
    instr.current = false
    instr.executed = false
  })
  
  // 重置向量表高亮
  interruptVectors.value.forEach(vector => {
    vector.highlight = false
  })
}

const setupInitialState = () => {
  cpuState.value = '执行主程序'
  programInstructions.value[0].current = true
  deviceStatus.value = '准备就绪'
  cpuActive.value = true
  deviceActive.value = true
}

const setupInterruptRequest = () => {
  deviceRequesting.value = true
  interruptSignal.value = true
  showInterruptRequest.value = true
  picActive.value = true
  interruptRequestRegister.value = '00000010'
  deviceStatus.value = '发送中断请求'
  
  addRegisterChange(2, 'I/O设备发送IRQ信号', 'request')
}

const setupInterruptResponse = () => {
  showInterruptResponse.value = true
  cpuState.value = '响应中断'
  interruptServiceRegister.value = '00000010'
  
  addRegisterChange(3, 'CPU响应中断，发送INTA信号', 'response')
}

const setupContextSave = () => {
  stackActive.value = true
  highlightPSW.value = true
  highlightPC.value = true
  highlightAX.value = true
  highlightBX.value = true
  
  // 模拟压栈过程
  stackItems.value = [
    { value: 'PSW: 0x0200', highlight: true, isNew: true },
    { value: 'PC: 0x1000', highlight: true, isNew: true },
    { value: 'AX: 0x1234', highlight: true, isNew: true },
    { value: 'BX: 0x5678', highlight: true, isNew: true }
  ]
  stackPointer.value = '0xFFFB'
  cpuState.value = '保存现场'
  
  addRegisterChange(4, '寄存器内容压入堆栈', 'save')
}

const setupFindISR = () => {
  ivtActive.value = true
  interruptVectors.value[4].highlight = true // 中断21h
  cpuState.value = '查找中断向量'
  
  addRegisterChange(5, '查找中断向量表，获取ISR地址', 'lookup')
}

const setupExecuteISR = () => {
  isrActive.value = true
  isrInstructions.value[0].current = true
  programCounter.value = '0x2000'
  cpuState.value = '执行中断服务程序'
  
  addRegisterChange(6, 'PC跳转到ISR入口地址', 'execute')
}

const setupContextRestore = () => {
  stackActive.value = true
  isrInstructions.value[6].current = true // IRET指令
  
  // 模拟出栈过程
  stackItems.value.forEach(item => {
    item.highlight = true
    item.isNew = false
  })
  stackPointer.value = '0xFFFF'
  cpuState.value = '恢复现场'
  
  addRegisterChange(7, '从堆栈恢复寄存器内容', 'restore')
}

const setupInterruptReturn = () => {
  programCounter.value = '0x1003'
  programInstructions.value[0].executed = true
  programInstructions.value[1].current = true
  cpuState.value = '继续执行主程序'
  stackItems.value = []
  
  addRegisterChange(8, 'PC恢复，继续执行主程序', 'return')
}

const addRegisterChange = (step: number, description: string, type: string) => {
  registerChanges.value.push({ step, description, type })
  if (registerChanges.value.length > 8) {
    registerChanges.value.shift()
  }
}

// 监听步骤变化
watch(currentStep, () => {
  executeStep()
})

onMounted(() => {
  executeStep()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.interrupt-demo {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 2.5rem;
  color: var(--text-primary);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--shadow-xl);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.interrupt-demo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color), var(--secondary-color));
  border-radius: 24px 24px 0 0;
}

.demo-header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: fadeIn 0.6s ease-out both;
}

.demo-header h2 {
  font-size: 2.2rem;
  margin: 0 0 0.75rem 0;
  color: var(--primary-color);
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.description {
  color: var(--text-secondary);
  font-size: 1.15rem;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
}

.demo-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  min-height: 700px;
}

.system-view {
  position: relative;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
  border-radius: 20px;
  padding: 2.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 2rem;
  border: 1px solid var(--border-light);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.component {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.component.active {
  border-color: var(--accent-color);
  box-shadow: 0 8px 25px rgba(66, 184, 131, 0.3);
  transform: scale(1.02);
}

.component.cpu {
  grid-column: 1;
  grid-row: 1;
}

.component.memory {
  grid-column: 1 / 3;
  grid-row: 2;
}

.component.io-device {
  grid-column: 2;
  grid-row: 1;
}

.component.io-device.requesting {
  border-color: var(--danger-color);
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  animation: pulse 1s infinite;
}

.component.interrupt-controller {
  grid-column: 2;
  grid-row: 3;
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.component-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.cpu-state, .device-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--primary-color);
  color: white;
}

.cpu-registers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.register {
  padding: 0.5rem;
  background: var(--bg-primary);
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.register.highlight {
  background: var(--warning-color);
  color: white;
  border-left-color: white;
  animation: glow 1s ease-in-out;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(243, 156, 18, 0.5); }
  50% { box-shadow: 0 0 20px rgba(243, 156, 18, 0.8); }
}

.memory-sections {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1rem;
}

.memory-section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.memory-section.active {
  border-color: var(--accent-color);
  background: rgba(66, 184, 131, 0.1);
}

.memory-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  text-align: center;
}

.interrupt-vector-table .vector-entry {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  margin: 0.25rem 0;
  background: white;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.vector-entry.highlight {
  background: var(--accent-color);
  color: white;
  animation: bounce 0.5s;
}

.stack {
  min-height: 200px;
}

.stack-pointer {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 4px;
}

.stack-content {
  display: flex;
  flex-direction: column-reverse;
  gap: 0.25rem;
}

.stack-item {
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.stack-item.highlight {
  background: var(--warning-color);
  color: white;
}

.stack-item.new {
  animation: slideIn 0.5s ease-out;
}

.program-instruction, .isr-instruction {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  margin: 0.25rem 0;
  background: white;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.program-instruction.current, .isr-instruction.current {
  background: var(--primary-color);
  color: white;
  animation: pulse 1s infinite;
}

.program-instruction.executed, .isr-instruction.executed {
  background: var(--success-color);
  color: white;
  opacity: 0.7;
}

.addr {
  min-width: 60px;
  color: var(--text-secondary);
}

.current .addr {
  color: rgba(255, 255, 255, 0.8);
}

.device-content, .pic-content {
  font-size: 0.9rem;
}

.interrupt-line {
  padding: 0.5rem;
  background: var(--bg-primary);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  border-left: 3px solid var(--danger-color);
  transition: all 0.3s ease;
}

.interrupt-line.active {
  background: var(--danger-color);
  color: white;
  border-left-color: white;
  animation: pulse 1s infinite;
}

.device-data, .interrupt-request, .interrupt-service, .interrupt-mask {
  padding: 0.25rem 0.5rem;
  margin: 0.25rem 0;
  background: var(--bg-primary);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}

.signal-flow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.signal-line {
  opacity: 0.8;
}

.control-panel {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.step-info h3 {
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.step-info h4 {
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.step-info p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

.step-controls {
  display: flex;
  gap: 1rem;
}

.step-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 2px solid var(--primary-color);
}

.prev-btn {
  background: white;
  color: var(--primary-color);
}

.next-btn {
  background: var(--primary-color);
  color: white;
}

.step-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-play-controls {
  display: flex;
  gap: 1rem;
}

.auto-play-btn, .reset-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.auto-play-btn {
  background: var(--accent-color);
  color: white;
  border: none;
}

.auto-play-btn.active {
  background: var(--warning-color);
}

.reset-btn {
  background: white;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.step-progress {
  text-align: center;
}

.progress-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transition: width 0.3s ease;
}

.step-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--border-color);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-indicator.active {
  background: var(--primary-color);
  color: white;
}

.step-indicator.current {
  background: var(--accent-color);
  transform: scale(1.1);
}

.detailed-explanation h4, .register-monitor h4 {
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.explanation-content {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 1rem;
}

.explanation-point {
  margin-bottom: 0.5rem;
  line-height: 1.5;
  color: var(--text-primary);
}

.register-changes {
  max-height: 150px;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 0.75rem;
}

.register-change {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.register-change.request {
  background: rgba(231, 76, 60, 0.1);
  border-left: 3px solid var(--danger-color);
}

.register-change.response {
  background: rgba(39, 174, 96, 0.1);
  border-left: 3px solid var(--success-color);
}

.register-change.save, .register-change.restore {
  background: rgba(243, 156, 18, 0.1);
  border-left: 3px solid var(--warning-color);
}

.register-change.lookup, .register-change.execute, .register-change.return {
  background: rgba(102, 126, 234, 0.1);
  border-left: 3px solid var(--primary-color);
}

.change-step {
  font-weight: 500;
  min-width: 60px;
}

.change-desc {
  color: var(--text-primary);
}

@media (max-width: 1024px) {
  .demo-container {
    grid-template-columns: 1fr;
  }

  .system-view {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, auto);
  }

  .component.memory {
    grid-column: 1;
    grid-row: 2;
  }

  .memory-sections {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
