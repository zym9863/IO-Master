<script setup lang="ts">
import { ref } from 'vue'
import IOSimulator from './components/IOSimulator.vue'
import InterruptDemo from './components/InterruptDemo.vue'
import HelpModal from './components/HelpModal.vue'

const activeTab = ref('io-modes')
const showHelp = ref(false)

const tabs = [
  { id: 'io-modes', name: 'I/O数据传输模式对比', component: IOSimulator },
  { id: 'interrupt', name: '中断处理流程演练', component: InterruptDemo }
]

const openHelp = () => {
  showHelp.value = true
}

const closeHelp = () => {
  showHelp.value = false
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <div class="title-section">
          <h1>计算机I/O系统交互式模拟器</h1>
          <p class="subtitle">深入理解计算机I/O控制方式与中断处理机制</p>
        </div>
        <button @click="openHelp" class="help-btn" title="使用帮助">
          <span>?</span>
        </button>
      </div>
    </header>

    <nav class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </nav>

    <main class="main-content">
      <component :is="tabs.find(tab => tab.id === activeTab)?.component" />
    </main>

    <!-- 帮助模态框 -->
    <HelpModal :visible="showHelp" @close="closeHelp" />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
  color: white;
  position: relative;
}

.app::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.app-header {
  padding: 3rem 1rem;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.title-section {
  text-align: center;
  flex: 1;
}

.app-header h1 {
  font-size: 3rem;
  margin: 0 0 0.75rem 0;
  font-weight: 800;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: float 6s ease-in-out infinite;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.95;
  margin: 0;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.help-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.6rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.help-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.help-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.help-btn:hover::before {
  opacity: 1;
}

.tab-nav {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.tab-button {
  padding: 1rem 2rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.tab-button:hover::before {
  left: 100%;
}

.tab-button.active {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  border-color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.main-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
