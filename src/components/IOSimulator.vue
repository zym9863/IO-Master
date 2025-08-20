<template>
  <div class="io-simulator">
    <div class="simulator-header">
      <h2>I/O数据传输模式可视化对比</h2>
      <p class="description">
        通过动画演示轮询、中断驱动和DMA三种I/O控制方式的工作原理和效率差异
      </p>
    </div>

    <div class="mode-selector">
      <button
        v-for="mode in modes"
        :key="mode.id"
        :class="['mode-btn', { active: selectedMode === mode.id }]"
        @click="selectMode(mode.id)"
      >
        {{ mode.name }}
      </button>
    </div>

    <div class="simulator-container">
      <!-- 系统架构图 -->
      <div class="system-diagram">
        <!-- CPU -->
        <div class="component cpu" :class="{ busy: cpuStatus === 'busy', idle: cpuStatus === 'idle' }">
          <div class="component-header">
            <h3>CPU</h3>
            <div class="status-indicator" :class="cpuStatus">
              {{ cpuStatus === 'busy' ? '忙碌' : '空闲' }}
            </div>
          </div>
          <div class="cpu-content">
            <div class="register">PC: {{ programCounter }}</div>
            <div class="register">状态: {{ cpuActivity }}</div>
          </div>
        </div>

        <!-- 内存 -->
        <div class="component memory">
          <div class="component-header">
            <h3>内存 (Memory)</h3>
          </div>
          <div class="memory-content">
            <div class="memory-block" v-for="(block, index) in memoryBlocks" :key="index" :class="{ active: block.active }">
              {{ block.data || '空' }}
            </div>
          </div>
        </div>

        <!-- I/O控制器 -->
        <div class="component controller" :class="{ active: controllerActive }">
          <div class="component-header">
            <h3>I/O控制器</h3>
          </div>
          <div class="controller-content">
            <div class="status-register">
              状态寄存器: {{ controllerStatus }}
            </div>
            <div class="data-register">
              数据寄存器: {{ controllerData }}
            </div>
          </div>
        </div>

        <!-- I/O设备 -->
        <div class="component device" :class="{ active: deviceActive }">
          <div class="component-header">
            <h3>I/O设备</h3>
          </div>
          <div class="device-content">
            <div class="device-status">
              设备状态: {{ deviceStatus }}
            </div>
            <div class="device-data">
              数据: {{ deviceData }}
            </div>
          </div>
        </div>

        <!-- DMA控制器 (仅在DMA模式下显示) -->
        <div v-if="selectedMode === 'dma'" class="component dma-controller" :class="{ active: dmaActive }">
          <div class="component-header">
            <h3>DMA控制器</h3>
          </div>
          <div class="dma-content">
            <div class="dma-register">源地址: {{ dmaSourceAddr }}</div>
            <div class="dma-register">目标地址: {{ dmaTargetAddr }}</div>
            <div class="dma-register">传输计数: {{ dmaCount }}</div>
          </div>
        </div>

        <!-- 数据流动线 -->
        <svg class="data-flow" viewBox="0 0 800 600">
          <!-- 轮询模式的数据流 -->
          <g v-if="selectedMode === 'polling'">
            <path
              class="flow-line"
              :class="{ active: showPollingFlow }"
              d="M 200 150 L 400 150 L 400 300 L 600 300"
              stroke="#667eea"
              stroke-width="3"
              fill="none"
            />
            <circle v-if="showPollingFlow" class="flow-dot" cx="200" cy="150" r="5" fill="#667eea">
              <animateMotion dur="2s" repeatCount="indefinite">
                <mpath href="#polling-path"/>
              </animateMotion>
            </circle>
          </g>

          <!-- 中断模式的数据流 -->
          <g v-if="selectedMode === 'interrupt'">
            <path
              class="flow-line interrupt-line"
              :class="{ active: showInterruptFlow }"
              d="M 600 300 L 400 300 L 400 150 L 200 150"
              stroke="#e74c3c"
              stroke-width="3"
              fill="none"
              stroke-dasharray="5,5"
            />
          </g>

          <!-- DMA模式的数据流 -->
          <g v-if="selectedMode === 'dma'">
            <path
              class="flow-line dma-line"
              :class="{ active: showDmaFlow }"
              d="M 600 300 L 300 300 L 300 200"
              stroke="#27ae60"
              stroke-width="3"
              fill="none"
            />
          </g>
        </svg>
      </div>

      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="mode-description">
          <h3>{{ currentModeInfo.name }}</h3>
          <p>{{ currentModeInfo.description }}</p>
        </div>

        <div class="simulation-controls">
          <button @click="startSimulation" :disabled="isSimulating" class="start-btn">
            {{ isSimulating ? '模拟中...' : '开始模拟' }}
          </button>
          <button @click="resetSimulation" class="reset-btn">重置</button>
        </div>

        <div class="performance-metrics">
          <h4>性能指标</h4>
          <div class="metric">
            <span>CPU利用率:</span>
            <div class="progress-bar">
              <div class="progress" :style="{ width: cpuUtilization + '%' }"></div>
            </div>
            <span>{{ cpuUtilization }}%</span>
          </div>
          <div class="metric">
            <span>传输效率:</span>
            <div class="progress-bar">
              <div class="progress" :style="{ width: transferEfficiency + '%' }"></div>
            </div>
            <span>{{ transferEfficiency }}%</span>
          </div>
        </div>

        <div class="simulation-log">
          <h4>模拟日志</h4>
          <div class="log-content">
            <div v-for="(log, index) in simulationLogs" :key="index" class="log-entry">
              <span class="timestamp">{{ log.timestamp }}</span>
              <span class="message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 模式定义
const modes = [
  { id: 'polling', name: '轮询模式', description: 'CPU不断查询I/O设备状态' },
  { id: 'interrupt', name: '中断模式', description: 'I/O设备主动通知CPU' },
  { id: 'dma', name: 'DMA模式', description: 'DMA控制器直接访问内存' }
]

// 响应式状态
const selectedMode = ref('polling')
const isSimulating = ref(false)
const cpuStatus = ref('idle')
const cpuActivity = ref('等待指令')
const programCounter = ref('0x1000')

// 组件状态
const controllerActive = ref(false)
const controllerStatus = ref('就绪')
const controllerData = ref('无')
const deviceActive = ref(false)
const deviceStatus = ref('空闲')
const deviceData = ref('无数据')
const dmaActive = ref(false)
const dmaSourceAddr = ref('0x2000')
const dmaTargetAddr = ref('0x3000')
const dmaCount = ref(1024)

// 内存块
const memoryBlocks = ref(Array(8).fill(null).map(() => ({
  data: '',
  active: false
})))

// 数据流动画
const showPollingFlow = ref(false)
const showInterruptFlow = ref(false)
const showDmaFlow = ref(false)

// 性能指标
const cpuUtilization = ref(0)
const transferEfficiency = ref(0)

// 模拟日志
const simulationLogs = ref<Array<{timestamp: string, message: string}>>([])

// 计算属性
const currentModeInfo = computed(() => {
  return modes.find(mode => mode.id === selectedMode.value) || modes[0]
})

// 方法
const selectMode = (modeId: string) => {
  if (!isSimulating.value) {
    selectedMode.value = modeId
    resetSimulation()
  }
}

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  simulationLogs.value.push({ timestamp, message })
  if (simulationLogs.value.length > 10) {
    simulationLogs.value.shift()
  }
}

const resetSimulation = () => {
  isSimulating.value = false
  cpuStatus.value = 'idle'
  cpuActivity.value = '等待指令'
  controllerActive.value = false
  deviceActive.value = false
  dmaActive.value = false
  showPollingFlow.value = false
  showInterruptFlow.value = false
  showDmaFlow.value = false
  cpuUtilization.value = 0
  transferEfficiency.value = 0
  simulationLogs.value = []
  memoryBlocks.value.forEach(block => {
    block.data = ''
    block.active = false
  })
}

const startSimulation = async () => {
  if (isSimulating.value) return
  
  isSimulating.value = true
  addLog(`开始${currentModeInfo.value.name}模拟`)
  
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
  
  isSimulating.value = false
  addLog('模拟完成')
}

const simulatePolling = async () => {
  addLog('CPU开始轮询I/O设备状态')
  cpuStatus.value = 'busy'
  cpuActivity.value = '轮询I/O状态'
  cpuUtilization.value = 90
  transferEfficiency.value = 30
  
  // 模拟多次轮询
  for (let i = 0; i < 5; i++) {
    showPollingFlow.value = true
    controllerActive.value = true
    addLog(`第${i + 1}次轮询 - 设备未就绪`)
    await new Promise(resolve => setTimeout(resolve, 1000))
    showPollingFlow.value = false
    controllerActive.value = false
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 设备就绪
  deviceActive.value = true
  deviceStatus.value = '就绪'
  deviceData.value = 'Data_001'
  addLog('设备就绪，开始数据传输')
  
  // 数据传输
  showPollingFlow.value = true
  controllerActive.value = true
  controllerData.value = 'Data_001'
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 数据到达内存
  memoryBlocks.value[0].data = 'Data_001'
  memoryBlocks.value[0].active = true
  addLog('数据传输完成')
  
  cpuStatus.value = 'idle'
  cpuActivity.value = '处理其他任务'
}

const simulateInterrupt = async () => {
  addLog('CPU执行其他任务，等待中断')
  cpuStatus.value = 'idle'
  cpuActivity.value = '执行其他任务'
  cpuUtilization.value = 20
  transferEfficiency.value = 85
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 设备准备好数据
  deviceActive.value = true
  deviceStatus.value = '就绪'
  deviceData.value = 'Data_002'
  addLog('I/O设备准备就绪，发送中断请求')
  
  // 中断信号
  showInterruptFlow.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // CPU响应中断
  cpuStatus.value = 'busy'
  cpuActivity.value = '处理中断'
  addLog('CPU响应中断，开始数据传输')
  
  controllerActive.value = true
  controllerData.value = 'Data_002'
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 数据传输完成
  memoryBlocks.value[1].data = 'Data_002'
  memoryBlocks.value[1].active = true
  addLog('数据传输完成，返回主程序')
  
  cpuStatus.value = 'idle'
  cpuActivity.value = '继续执行主程序'
  showInterruptFlow.value = false
}

const simulateDMA = async () => {
  addLog('CPU配置DMA控制器')
  cpuStatus.value = 'busy'
  cpuActivity.value = '配置DMA'
  cpuUtilization.value = 10
  transferEfficiency.value = 95
  
  // 配置DMA
  dmaActive.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  addLog('DMA配置完成，CPU继续执行其他任务')
  cpuStatus.value = 'idle'
  cpuActivity.value = '执行其他任务'
  
  // 设备准备数据
  deviceActive.value = true
  deviceStatus.value = '就绪'
  deviceData.value = 'Data_003'
  addLog('I/O设备准备就绪，DMA开始传输')
  
  // DMA直接传输
  showDmaFlow.value = true
  controllerActive.value = true
  
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 800))
    memoryBlocks.value[i + 2].data = `Data_00${i + 3}`
    memoryBlocks.value[i + 2].active = true
    dmaCount.value -= 256
    addLog(`DMA传输进度: ${((i + 1) / 3 * 100).toFixed(0)}%`)
  }
  
  addLog('DMA传输完成，通知CPU')
  showDmaFlow.value = false
  dmaActive.value = false
}

onMounted(() => {
  resetSimulation()
})
</script>

<style scoped>
.io-simulator {
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

.io-simulator::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color), var(--secondary-color));
  border-radius: 24px 24px 0 0;
}

.simulator-header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: fadeIn 0.6s ease-out both;
}

.simulator-header h2 {
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

.mode-selector {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  animation: fadeIn 0.6s ease-out 0.2s both;
}

.mode-btn {
  padding: 1rem 2rem;
  border: 2px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.mode-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left 0.6s ease;
}

.mode-btn:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-dark);
}

.mode-btn:hover::before {
  left: 100%;
}

.mode-btn.active {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.simulator-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  min-height: 600px;
}

.system-diagram {
  position: relative;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
  border-radius: 20px;
  padding: 2.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 2rem;
  border: 1px solid var(--border-light);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.component {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.component::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.component.active {
  border-color: var(--accent-color);
  box-shadow: 0 12px 40px rgba(66, 184, 131, 0.25);
  transform: scale(1.02) translateY(-2px);
}

.component.active::before {
  opacity: 1;
}

.component.cpu {
  grid-column: 1;
  grid-row: 1;
}

.component.cpu.busy {
  border-color: var(--danger-color);
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  box-shadow: 0 12px 40px rgba(231, 76, 60, 0.2);
}

.component.cpu.idle {
  border-color: var(--success-color);
  background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
  box-shadow: 0 12px 40px rgba(39, 174, 96, 0.2);
}

.component.memory {
  grid-column: 1;
  grid-row: 2;
}

.component.controller {
  grid-column: 2;
  grid-row: 2;
}

.component.device {
  grid-column: 2;
  grid-row: 3;
}

.component.dma-controller {
  grid-column: 1;
  grid-row: 3;
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--border-light);
}

.component-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary);
  font-weight: 700;
}

.status-indicator {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: var(--shadow-sm);
}

.status-indicator.busy {
  background: var(--danger-color);
  color: white;
}

.status-indicator.idle {
  background: var(--success-color);
  color: white;
}

.cpu-content, .memory-content, .controller-content, .device-content, .dma-content {
  font-size: 0.9rem;
}

.register, .memory-block, .status-register, .data-register, .device-status, .device-data, .dma-register {
  padding: 0.5rem 0.75rem;
  margin: 0.4rem 0;
  background: var(--bg-primary);
  border-radius: 10px;
  border-left: 4px solid var(--primary-color);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.register:hover, .memory-block:hover, .status-register:hover, 
.data-register:hover, .device-status:hover, .device-data:hover, 
.dma-register:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.memory-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
}

.memory-block.active {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
  color: white;
  border-left-color: white;
  box-shadow: var(--shadow-md);
  animation: glow 2s ease-in-out infinite;
}

.data-flow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.flow-line {
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.flow-line.active {
  opacity: 1;
}

.interrupt-line {
  animation: dash 2s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -20;
  }
}

.control-panel {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  height: fit-content;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
}

.mode-description h3 {
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.mode-description p {
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.simulation-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.start-btn, .reset-btn {
  flex: 1;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.start-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  box-shadow: var(--shadow-md);
}

.start-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.start-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--secondary-color), var(--secondary-dark));
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.start-btn:hover:not(:disabled)::before {
  left: 100%;
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reset-btn {
  background: white;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.reset-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.performance-metrics h4, .simulation-log h4 {
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.metric {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.metric span:first-child {
  min-width: 80px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.progress::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

.metric span:last-child {
  min-width: 40px;
  text-align: right;
  font-weight: 500;
  color: var(--primary-color);
}

.simulation-log {
  margin-top: 1.5rem;
}

.log-content {
  max-height: 220px;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-light);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: var(--border-light);
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: var(--primary-dark);
}

.log-entry {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.log-entry:hover {
  background: rgba(102, 126, 234, 0.05);
}

.log-entry:last-child {
  margin-bottom: 0;
}

.timestamp {
  color: var(--text-muted);
  min-width: 85px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}

.message {
  color: var(--text-primary);
  font-weight: 500;
}

@media (max-width: 1024px) {
  .simulator-container {
    grid-template-columns: 1fr;
  }

  .system-diagram {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(5, auto);
  }

  .component.cpu { grid-column: 1; grid-row: 1; }
  .component.memory { grid-column: 1; grid-row: 2; }
  .component.controller { grid-column: 1; grid-row: 3; }
  .component.device { grid-column: 1; grid-row: 4; }
  .component.dma-controller { grid-column: 1; grid-row: 5; }
}
</style>
