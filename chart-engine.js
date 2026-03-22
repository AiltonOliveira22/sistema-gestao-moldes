/**
 * ========================================
 * CHART ENGINE V5.0.0
 * Sistema Modular de Gráficos Interativos
 * ========================================
 */

class ChartEngine {
    constructor() {
        this.charts = {}; // Cache de gráficos ativos
        this.defaultColors = {
            primary: '#FFC107',
            secondary: '#FFA000',
            success: '#4CAF50',
            danger: '#F44336',
            warning: '#FF9800',
            info: '#2196F3',
            light: '#e8e8e8',
            dark: '#0d0d0d'
        };
    }

    // ==================== GERENCIAMENTO ====================
    
    /**
     * Destroi um gráfico existente
     */
    destroy(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
    
    /**
     * Destroi todos os gráficos
     */
    destroyAll() {
        Object.keys(this.charts).forEach(id => this.destroy(id));
    }

    // ==================== GRÁFICOS BASE ====================
    
    /**
     * Cria gráfico de linha
     * @param {String} canvasId - ID do canvas
     * @param {Object} config - {labels, datasets: [{label, data, color}]}
     */
    createLine(canvasId, config) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas ${canvasId} não encontrado`);
            return null;
        }

        const chartConfig = {
            type: 'line',
            data: {
                labels: config.labels || [],
                datasets: (config.datasets || []).map((dataset, index) => ({
                    label: dataset.label || `Dataset ${index + 1}`,
                    data: dataset.data || [],
                    borderColor: dataset.color || this.defaultColors.primary,
                    backgroundColor: this.hexToRgba(dataset.color || this.defaultColors.primary, 0.1),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: dataset.color || this.defaultColors.primary,
                    pointBorderColor: '#000',
                    pointBorderWidth: 1
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: config.showLegend !== false,
                        position: 'bottom',
                        labels: {
                            color: this.defaultColors.light,
                            font: { size: 11 },
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: this.defaultColors.primary,
                        bodyColor: this.defaultColors.light,
                        borderColor: this.defaultColors.primary,
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: this.defaultColors.light,
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: this.defaultColors.light,
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, chartConfig);
        return this.charts[canvasId];
    }
    
    /**
     * Cria gráfico de barras
     * @param {String} canvasId - ID do canvas
     * @param {Object} config - {labels, datasets: [{label, data, color}]}
     */
    createBar(canvasId, config) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas ${canvasId} não encontrado`);
            return null;
        }

        const chartConfig = {
            type: 'bar',
            data: {
                labels: config.labels || [],
                datasets: (config.datasets || []).map((dataset, index) => ({
                    label: dataset.label || `Dataset ${index + 1}`,
                    data: dataset.data || [],
                    backgroundColor: dataset.color || this.defaultColors.primary,
                    borderColor: dataset.borderColor || this.darkenColor(dataset.color || this.defaultColors.primary, 20),
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: config.showLegend !== false,
                        position: 'bottom',
                        labels: {
                            color: this.defaultColors.light,
                            font: { size: 11 },
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: this.defaultColors.primary,
                        bodyColor: this.defaultColors.light,
                        borderColor: this.defaultColors.primary,
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: this.defaultColors.light,
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: this.defaultColors.light,
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, chartConfig);
        return this.charts[canvasId];
    }
    
    /**
     * Cria gráfico de pizza/donut
     * @param {String} canvasId - ID do canvas
     * @param {Object} config - {labels, data, colors, cutout (0-100 para donut)}
     */
    createPie(canvasId, config) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas ${canvasId} não encontrado`);
            return null;
        }

        const colors = config.colors || [
            this.defaultColors.primary,
            this.defaultColors.success,
            this.defaultColors.danger,
            this.defaultColors.info,
            this.defaultColors.warning,
            '#9C27B0',
            '#00BCD4',
            '#8BC34A'
        ];

        const chartConfig = {
            type: config.type || 'doughnut',
            data: {
                labels: config.labels || [],
                datasets: [{
                    data: config.data || [],
                    backgroundColor: colors,
                    borderColor: '#000',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: config.cutout || '60%',
                plugins: {
                    legend: {
                        display: config.showLegend !== false,
                        position: 'right',
                        labels: {
                            color: this.defaultColors.light,
                            font: { size: 10 },
                            padding: 10,
                            usePointStyle: true,
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percent = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label}: ${percent}%`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: this.defaultColors.primary,
                        bodyColor: this.defaultColors.light,
                        borderColor: this.defaultColors.primary,
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, chartConfig);
        return this.charts[canvasId];
    }

    // ==================== GRÁFICOS AVANÇADOS ====================
    
    /**
     * Cria gráfico de barras empilhadas
     */
    createStackedBar(canvasId, config) {
        const barConfig = { ...config };
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        this.destroy(canvasId);
        
        const chartConfig = {
            type: 'bar',
            data: {
                labels: config.labels || [],
                datasets: (config.datasets || []).map(dataset => ({
                    ...dataset,
                    backgroundColor: dataset.color || this.defaultColors.primary
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            color: this.defaultColors.light,
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            color: this.defaultColors.light,
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: this.defaultColors.light,
                            font: { size: 11 },
                            padding: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: this.defaultColors.primary,
                        bodyColor: this.defaultColors.light,
                        borderColor: this.defaultColors.primary,
                        borderWidth: 1
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, chartConfig);
        return this.charts[canvasId];
    }
    
    /**
     * Cria gráfico radar
     */
    createRadar(canvasId, config) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartConfig = {
            type: 'radar',
            data: {
                labels: config.labels || [],
                datasets: (config.datasets || []).map(dataset => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: this.hexToRgba(dataset.color || this.defaultColors.primary, 0.2),
                    borderColor: dataset.color || this.defaultColors.primary,
                    borderWidth: 2,
                    pointBackgroundColor: dataset.color || this.defaultColors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: dataset.color || this.defaultColors.primary
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            color: this.defaultColors.light,
                            font: { size: 10 },
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: this.defaultColors.light,
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: this.defaultColors.light,
                            font: { size: 11 },
                            padding: 10
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, chartConfig);
        return this.charts[canvasId];
    }

    // ==================== UTILITÁRIOS ====================
    
    /**
     * Converte HEX para RGBA
     */
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    /**
     * Escurece uma cor
     */
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }
    
    /**
     * Atualiza dados de um gráfico existente
     */
    updateChart(canvasId, newData) {
        if (!this.charts[canvasId]) {
            console.error(`Gráfico ${canvasId} não encontrado`);
            return;
        }
        
        const chart = this.charts[canvasId];
        chart.data = newData;
        chart.update();
    }
    
    /**
     * Exporta gráfico como imagem
     */
    exportAsImage(canvasId, filename = 'chart.png') {
        if (!this.charts[canvasId]) {
            console.error(`Gráfico ${canvasId} não encontrado`);
            return;
        }
        
        const canvas = document.getElementById(canvasId);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
    }
}

// Export para uso no app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartEngine;
}
