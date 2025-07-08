[English](./README_EN.md) | [简体中文](./README.md)

# Interactive Simulator for Computer I/O Systems

An interactive teaching tool based on Vue 3 + TypeScript for in-depth understanding of computer I/O control methods and interrupt handling mechanisms.

## 🎯 Project Features

### Core Functions

1. **Visualization of I/O Data Transfer Modes**
   - Polling: Demonstrates the CPU constantly querying device status
   - Interrupt: Shows the mechanism where devices actively notify the CPU
   - DMA: Visualizes efficient data transfer via Direct Memory Access

2. **Step-by-Step Interactive Interrupt Handling**
   - 8 detailed steps with stepwise demonstration
   - Real-time display of CPU registers and memory state changes
   - Visualized interrupt vector table and stack operations

### Technical Highlights

- 🎨 **Modern UI Design**: Gradient backgrounds and glassmorphism
- 🔄 **Smooth Animations**: Custom animation system vividly shows data flow
- 📱 **Responsive Layout**: Adapts to different screen sizes
- 🎮 **Interactive Controls**: Supports manual stepping and auto-play
- 📊 **Performance Monitoring**: Real-time CPU usage and transfer efficiency
- 📚 **Detailed Help Docs**: Built-in user guide and FAQ

## 🚀 Quick Start

### Requirements

- Node.js 16+
- pnpm (recommended) or npm

### Install Dependencies

```bash
pnpm install
```

### Start Development Server

```bash
pnpm dev
```

Visit http://localhost:5173 to view the app

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## 📁 Project Structure

```
src/
├── components/           # Vue components
│   ├── IOSimulator.vue  # Main I/O simulator component
│   ├── InterruptDemo.vue # Interrupt demo component
│   └── HelpModal.vue    # Help modal
├── composables/         # Composables
│   ├── useSimulator.ts  # I/O simulator state management
│   └── useInterruptDemo.ts # Interrupt demo state management
├── utils/              # Utility functions
│   └── animations.ts   # Animation controller and utilities
├── App.vue            # Main app component
├── main.ts           # App entry point
└── style.css         # Global styles
```

## 🎓 Educational Content

### I/O Control Mode Comparison

| Mode    | CPU Usage | Transfer Efficiency | Typical Scenario         |
|---------|-----------|--------------------|-------------------------|
| Polling | 90%       | 30%                | Simple embedded systems |
| Interrupt | 20%     | 85%                | General-purpose systems |
| DMA     | 10%       | 95%                | High-performance transfer|

### Interrupt Handling Steps

1. **Initial State** - CPU executes main program
2. **Interrupt Request** - I/O device sends IRQ signal
3. **Interrupt Response** - CPU acknowledges and confirms
4. **Context Save** - Registers saved to stack
5. **Find ISR** - Locate service routine via interrupt vector table
6. **Execute ISR** - Handle interrupt request
7. **Context Restore** - Restore registers from stack
8. **Return from Interrupt** - Resume main program

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Utility Library**: @vueuse/core

## 📖 User Guide

1. **Select Mode**: Switch I/O transfer modes via top buttons
2. **Start Simulation**: Click "Start Simulation" to watch the animation
3. **View Metrics**: Observe CPU usage and transfer efficiency
4. **Read Logs**: Check detailed simulation logs
5. **Interrupt Demo**: Switch to the interrupt tab and use step controls to explore the mechanism
6. **Get Help**: Click the "?" button in the top right for detailed instructions

## 🎯 Learning Goals

With this simulator, learners can:

- Understand the principles and features of three main I/O control methods
- Master the complete process and key concepts of interrupt handling
- Learn the interactions among CPU, memory, and I/O controllers
- Recognize performance differences and application scenarios of I/O methods
- Deepen understanding of computer system internals

## 🤝 Contributing

Feel free to submit Issues and Pull Requests to improve this project!

## 📄 License

MIT License
