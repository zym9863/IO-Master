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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.app-header {
  padding: 2rem 1rem;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
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
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.help-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.tab-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.05);
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 500;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.tab-button.active {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border-color: white;
}

.main-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
