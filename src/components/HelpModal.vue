<template>
  <div v-if="visible" class="help-modal-overlay" @click="closeModal">
    <div class="help-modal" @click.stop>
      <div class="modal-header">
        <h2>使用指南</h2>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-content">
        <div class="help-tabs">
          <button 
            v-for="tab in helpTabs" 
            :key="tab.id"
            :class="['help-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>
        
        <div class="help-content">
          <!-- I/O模式对比帮助 -->
          <div v-if="activeTab === 'io-modes'" class="help-section">
            <h3>I/O数据传输模式对比</h3>
            
            <div class="mode-explanation">
              <div class="mode-card">
                <h4>🔄 轮询模式 (Polling)</h4>
                <p><strong>工作原理：</strong>CPU不断地查询I/O设备的状态寄存器，检查设备是否准备好进行数据传输。</p>
                <div class="pros-cons">
                  <div class="pros">
                    <h5>优点：</h5>
                    <ul>
                      <li>实现简单，逻辑清晰</li>
                      <li>适合简单的嵌入式系统</li>
                      <li>响应时间可预测</li>
                    </ul>
                  </div>
                  <div class="cons">
                    <h5>缺点：</h5>
                    <ul>
                      <li>CPU利用率低，大量时间浪费在等待上</li>
                      <li>功耗较高</li>
                      <li>不适合高性能系统</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="mode-card">
                <h4>⚡ 中断模式 (Interrupt)</h4>
                <p><strong>工作原理：</strong>I/O设备在准备好数据后主动向CPU发送中断信号，CPU响应中断并处理数据传输。</p>
                <div class="pros-cons">
                  <div class="pros">
                    <h5>优点：</h5>
                    <ul>
                      <li>CPU利用率高，可以执行其他任务</li>
                      <li>响应及时</li>
                      <li>功耗相对较低</li>
                    </ul>
                  </div>
                  <div class="cons">
                    <h5>缺点：</h5>
                    <ul>
                      <li>实现复杂，需要中断处理机制</li>
                      <li>中断处理有开销</li>
                      <li>可能出现中断嵌套问题</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="mode-card">
                <h4>🚀 DMA模式 (Direct Memory Access)</h4>
                <p><strong>工作原理：</strong>DMA控制器直接在内存和I/O设备之间传输数据，CPU只需要初始化DMA控制器。</p>
                <div class="pros-cons">
                  <div class="pros">
                    <h5>优点：</h5>
                    <ul>
                      <li>CPU几乎不参与数据传输</li>
                      <li>传输效率最高</li>
                      <li>适合大量数据传输</li>
                    </ul>
                  </div>
                  <div class="cons">
                    <h5>缺点：</h5>
                    <ul>
                      <li>硬件复杂，成本较高</li>
                      <li>需要专门的DMA控制器</li>
                      <li>可能与CPU争夺总线</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="usage-tips">
              <h4>使用提示：</h4>
              <ul>
                <li>点击模式按钮切换不同的I/O传输模式</li>
                <li>观察CPU状态监视器的变化</li>
                <li>注意性能指标的差异</li>
                <li>查看模拟日志了解详细过程</li>
              </ul>
            </div>
          </div>
          
          <!-- 中断处理帮助 -->
          <div v-if="activeTab === 'interrupt'" class="help-section">
            <h3>中断处理流程演练</h3>
            
            <div class="interrupt-steps">
              <div class="step-card" v-for="(step, index) in interruptSteps" :key="index">
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <h4>{{ step.title }}</h4>
                  <p>{{ step.description }}</p>
                  <div class="step-details">
                    <ul>
                      <li v-for="detail in step.details" :key="detail">{{ detail }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="control-tips">
              <h4>控制说明：</h4>
              <ul>
                <li><strong>下一步/上一步：</strong>手动控制演示进度</li>
                <li><strong>自动播放：</strong>自动按顺序执行所有步骤</li>
                <li><strong>步骤指示器：</strong>点击可直接跳转到指定步骤</li>
                <li><strong>重置演示：</strong>回到初始状态</li>
              </ul>
            </div>
          </div>
          
          <!-- 系统架构帮助 -->
          <div v-if="activeTab === 'architecture'" class="help-section">
            <h3>系统架构说明</h3>
            
            <div class="architecture-explanation">
              <div class="component-explanation">
                <h4>🖥️ CPU (中央处理器)</h4>
                <p>负责执行指令、处理数据和控制系统运行。在I/O操作中，CPU的参与程度因传输模式而异。</p>
                <ul>
                  <li><strong>状态监视器：</strong>显示CPU当前是忙碌还是空闲</li>
                  <li><strong>寄存器：</strong>显示程序计数器PC和其他重要寄存器的值</li>
                </ul>
              </div>
              
              <div class="component-explanation">
                <h4>💾 内存 (Memory)</h4>
                <p>存储程序指令和数据。在中断演示中，特别关注中断向量表和堆栈区域。</p>
                <ul>
                  <li><strong>中断向量表：</strong>存储各种中断服务程序的入口地址</li>
                  <li><strong>堆栈：</strong>用于保存和恢复CPU现场</li>
                  <li><strong>程序区域：</strong>存储主程序指令</li>
                </ul>
              </div>
              
              <div class="component-explanation">
                <h4>🎛️ I/O控制器</h4>
                <p>管理CPU与I/O设备之间的通信，包含状态寄存器和数据寄存器。</p>
                <ul>
                  <li><strong>状态寄存器：</strong>指示设备当前状态</li>
                  <li><strong>数据寄存器：</strong>暂存传输的数据</li>
                </ul>
              </div>
              
              <div class="component-explanation">
                <h4>📱 I/O设备</h4>
                <p>实际的输入输出设备，如键盘、鼠标、硬盘等。</p>
                <ul>
                  <li><strong>设备状态：</strong>显示设备是否准备好进行数据传输</li>
                  <li><strong>中断信号：</strong>设备可以向CPU发送中断请求</li>
                </ul>
              </div>
              
              <div class="component-explanation">
                <h4>🔧 DMA控制器</h4>
                <p>专门负责直接内存访问的控制器，可以独立于CPU进行数据传输。</p>
                <ul>
                  <li><strong>源地址：</strong>数据传输的源地址</li>
                  <li><strong>目标地址：</strong>数据传输的目标地址</li>
                  <li><strong>传输计数：</strong>剩余传输的数据量</li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- 常见问题 -->
          <div v-if="activeTab === 'faq'" class="help-section">
            <h3>常见问题</h3>
            
            <div class="faq-list">
              <div class="faq-item">
                <h4>Q: 为什么轮询模式的CPU利用率这么高？</h4>
                <p>A: 因为在轮询模式下，CPU需要不断地检查I/O设备状态，即使设备没有准备好，CPU也在持续工作，所以利用率很高但效率很低。</p>
              </div>
              
              <div class="faq-item">
                <h4>Q: 中断处理过程中为什么要保存现场？</h4>
                <p>A: 因为中断是异步发生的，CPU需要暂停当前程序去处理中断。为了在中断处理完成后能够正确返回并继续执行原程序，必须保存当前的CPU状态（寄存器值等）。</p>
              </div>
              
              <div class="faq-item">
                <h4>Q: DMA模式下CPU真的完全不参与吗？</h4>
                <p>A: 不是完全不参与。CPU需要初始化DMA控制器，设置传输参数。在传输过程中CPU可以执行其他任务，传输完成后DMA会通知CPU。</p>
              </div>
              
              <div class="faq-item">
                <h4>Q: 中断向量表的作用是什么？</h4>
                <p>A: 中断向量表存储了各种中断类型对应的中断服务程序入口地址。当发生中断时，CPU根据中断类型码在向量表中查找对应的服务程序地址。</p>
              </div>
              
              <div class="faq-item">
                <h4>Q: 如何选择合适的I/O控制方式？</h4>
                <p>A: 根据应用场景选择：简单系统可用轮询；需要及时响应的系统用中断；大量数据传输的高性能系统用DMA。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const activeTab = ref('io-modes')

const helpTabs = [
  { id: 'io-modes', name: 'I/O模式对比' },
  { id: 'interrupt', name: '中断处理' },
  { id: 'architecture', name: '系统架构' },
  { id: 'faq', name: '常见问题' }
]

const interruptSteps = [
  {
    title: '初始状态',
    description: 'CPU正在执行主程序，I/O设备准备发送中断请求',
    details: ['CPU执行指令', 'PC指向当前指令', 'PSW包含状态信息', 'I/O设备准备数据']
  },
  {
    title: '中断请求',
    description: 'I/O设备向CPU发送中断请求信号',
    details: ['设备发送IRQ信号', '中断控制器接收请求', '设置IRR寄存器', 'CPU检查中断']
  },
  {
    title: '中断响应',
    description: 'CPU响应中断请求，准备处理中断',
    details: ['完成当前指令', '检查中断标志', '发送INTA信号', '获取中断类型码']
  },
  {
    title: '现场保护',
    description: 'CPU保存当前程序的执行现场到堆栈',
    details: ['PSW压入堆栈', 'PC压入堆栈', '寄存器压入堆栈', '调整堆栈指针']
  },
  {
    title: '寻找中断服务程序',
    description: 'CPU根据中断类型码查找中断向量表',
    details: ['使用类型码作索引', '访问中断向量表', '读取服务程序地址', '准备跳转']
  },
  {
    title: '执行中断服务程序',
    description: 'CPU跳转到中断服务程序并开始执行',
    details: ['设置PC为ISR地址', '执行服务程序', '处理I/O请求', '执行设备操作']
  },
  {
    title: '现场恢复',
    description: '中断服务程序执行完毕，恢复被中断程序的现场',
    details: ['执行IRET指令', '恢复寄存器', '恢复PC和PSW', '调整堆栈指针']
  },
  {
    title: '中断返回',
    description: 'CPU返回到被中断的主程序继续执行',
    details: ['PC恢复到中断点', 'CPU状态完全恢复', '继续执行主程序', '中断处理结束']
  }
]

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.help-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-content {
  height: calc(90vh - 100px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.help-tabs {
  display: flex;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.help-tab {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  border-bottom: 3px solid transparent;
}

.help-tab:hover {
  background: rgba(102, 126, 234, 0.1);
  color: var(--primary-color);
}

.help-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background: white;
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  color: #2c3e50;
}

.help-section h3 {
  color: var(--primary-color);
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
}

.mode-explanation {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.mode-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid var(--primary-color);
}

.mode-card h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.mode-card p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  color: var(--text-secondary);
}

.pros-cons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.pros, .cons {
  background: white;
  border-radius: 8px;
  padding: 1rem;
}

.pros h5 {
  color: var(--success-color);
  margin: 0 0 0.5rem 0;
}

.cons h5 {
  color: var(--danger-color);
  margin: 0 0 0.5rem 0;
}

.pros ul, .cons ul {
  margin: 0;
  padding-left: 1.2rem;
}

.pros li, .cons li {
  margin-bottom: 0.25rem;
  line-height: 1.4;
}

.usage-tips {
  background: rgba(66, 184, 131, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid var(--accent-color);
}

.usage-tips h4 {
  color: var(--accent-color);
  margin: 0 0 1rem 0;
}

.usage-tips ul {
  margin: 0;
  padding-left: 1.2rem;
}

.usage-tips li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
  color: #333;
}

.interrupt-steps {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.step-card {
  display: flex;
  gap: 1rem;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.3s ease;
}

.step-card:hover {
  transform: translateX(5px);
}

.step-number {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.step-content p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.step-details ul {
  margin: 0;
  padding-left: 1.2rem;
}

.step-details li {
  margin-bottom: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.control-tips {
  background: rgba(243, 156, 18, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid var(--warning-color);
}

.control-tips h4 {
  color: var(--warning-color);
  margin: 0 0 1rem 0;
}

.control-tips ul {
  margin: 0;
  padding-left: 1.2rem;
}

.control-tips li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.architecture-explanation {
  display: grid;
  gap: 1.5rem;
}

.component-explanation {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid var(--primary-color);
}

.component-explanation h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.component-explanation p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  color: var(--text-secondary);
}

.component-explanation ul {
  margin: 0;
  padding-left: 1.2rem;
}

.component-explanation li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.faq-list {
  display: grid;
  gap: 1.5rem;
}

.faq-item {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid var(--accent-color);
}

.faq-item h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.faq-item p {
  margin: 0;
  line-height: 1.6;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .help-modal {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .help-content {
    padding: 1rem;
  }

  .pros-cons {
    grid-template-columns: 1fr;
  }

  .help-tabs {
    flex-wrap: wrap;
  }

  .help-tab {
    flex: 1;
    min-width: 120px;
  }
}
</style>
