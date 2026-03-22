/**
 * ========================================
 * ANALYTICS ENGINE V5.0.0
 * Sistema Modular de Análise de Dados
 * ========================================
 */

class AnalyticsEngine {
    constructor(storage) {
        this.storage = storage;
    }

    // ==================== ESTATÍSTICAS BASE ====================
    
    /**
     * Calcula estatísticas descritivas de um conjunto de dados
     * @param {Array} data - Array de objetos
     * @param {String} key - Chave para extrair valores
     * @returns {Object} - {mean, median, mode, stdDev, variance, min, max, count}
     */
    calculateStats(data, key) {
        const values = data
            .map(d => parseFloat(d[key]) || 0)
            .filter(v => !isNaN(v) && v !== 0);
        
        if (!values.length) return null;
        
        // Média
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        
        // Mediana
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        
        // Moda
        const mode = this.calculateMode(values);
        
        // Variância e Desvio Padrão
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Min e Max
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return {
            mean: Number(mean.toFixed(2)),
            median: Number(median.toFixed(2)),
            mode: mode,
            stdDev: Number(stdDev.toFixed(2)),
            variance: Number(variance.toFixed(2)),
            min,
            max,
            count: values.length
        };
    }
    
    /**
     * Calcula a moda (valor mais frequente)
     */
    calculateMode(arr) {
        const freq = {};
        let maxFreq = 0;
        let mode = null;
        
        arr.forEach(v => {
            const rounded = Math.round(v * 100) / 100;
            freq[rounded] = (freq[rounded] || 0) + 1;
            if (freq[rounded] > maxFreq) {
                maxFreq = freq[rounded];
                mode = rounded;
            }
        });
        
        return mode;
    }

    // ==================== AGRUPAMENTO ====================
    
    /**
     * Agrupa dados por uma chave
     * @param {Array} data - Array de objetos
     * @param {String} key - Chave para agrupamento
     * @returns {Object} - {grupo: [itens]}
     */
    groupBy(data, key) {
        return data.reduce((groups, item) => {
            const value = item[key] || 'Não definido';
            groups[value] = groups[value] || [];
            groups[value].push(item);
            return groups;
        }, {});
    }
    
    /**
     * Agrega dados por uma chave com operação
     * @param {Array} data - Array de objetos
     * @param {String} groupKey - Chave para agrupamento
     * @param {String} valueKey - Chave para agregação
     * @param {String} operation - 'sum', 'avg', 'count', 'min', 'max'
     * @returns {Object} - {grupo: valor_agregado}
     */
    aggregateBy(data, groupKey, valueKey, operation = 'sum') {
        const grouped = this.groupBy(data, groupKey);
        const result = {};
        
        for (const [key, items] of Object.entries(grouped)) {
            const values = items.map(i => parseFloat(i[valueKey]) || 0);
            
            switch(operation) {
                case 'sum':
                    result[key] = values.reduce((a, b) => a + b, 0);
                    break;
                case 'avg':
                    result[key] = values.reduce((a, b) => a + b, 0) / values.length;
                    break;
                case 'count':
                    result[key] = items.length;
                    break;
                case 'min':
                    result[key] = Math.min(...values);
                    break;
                case 'max':
                    result[key] = Math.max(...values);
                    break;
            }
        }
        
        return result;
    }

    // ==================== ANÁLISE TEMPORAL ====================
    
    /**
     * Tenta fazer parse de uma data em múltiplos formatos
     * @param {String} dateStr - String de data
     * @returns {Date|null} - Data parseada ou null
     */
    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Tenta vários formatos comuns
        const formats = [
            /(\d{2})\/(\d{2})\/(\d{4})/,       // DD/MM/YYYY
            /(\d{4})-(\d{2})-(\d{2})/,         // YYYY-MM-DD
            /(\d{2})-(\d{2})-(\d{4})/,         // DD-MM-YYYY
        ];
        
        for (const format of formats) {
            const match = String(dateStr).match(format);
            if (match) {
                if (format.source.startsWith('(\\d{2})')) {
                    // DD/MM/YYYY ou DD-MM-YYYY
                    return new Date(match[3], match[2] - 1, match[1]);
                } else {
                    // YYYY-MM-DD
                    return new Date(match[1], match[2] - 1, match[3]);
                }
            }
        }
        
        // Tenta Date.parse como último recurso
        const parsed = new Date(dateStr);
        return isNaN(parsed) ? null : parsed;
    }
    
    /**
     * Filtra dados por range de datas
     */
    filterByDateRange(data, startDate, endDate, dateKey) {
        return data.filter(item => {
            const date = this.parseDate(item[dateKey]);
            if (!date) return false;
            return date >= startDate && date <= endDate;
        });
    }
    
    /**
     * Agrupa dados por período
     * @param {Array} data - Array de objetos
     * @param {String} dateKey - Chave da data
     * @param {String} period - 'day', 'week', 'month', 'year'
     * @returns {Object} - {periodo: [itens]}
     */
    groupByPeriod(data, dateKey, period = 'month') {
        const grouped = {};
        
        data.forEach(item => {
            const date = this.parseDate(item[dateKey]);
            if (!date) return;
            
            let key;
            switch(period) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const week = this.getWeekNumber(date);
                    key = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    break;
            }
            
            grouped[key] = grouped[key] || [];
            grouped[key].push(item);
        });
        
        return grouped;
    }
    
    /**
     * Retorna número da semana no ano
     */
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // ==================== TENDÊNCIAS ====================
    
    /**
     * Detecta tendência em uma série temporal
     * @param {Array} timeSeries - Array de valores numéricos
     * @param {Number} window - Janela de comparação
     * @returns {Object} - {trend, change, recentAvg, previousAvg}
     */
    detectTrend(timeSeries, window = 7) {
        if (timeSeries.length < window) {
            return { trend: 'insufficient_data', change: 0 };
        }
        
        const recent = timeSeries.slice(-window);
        const previous = timeSeries.slice(-window * 2, -window);
        
        if (previous.length === 0) {
            return { trend: 'neutral', change: 0 };
        }
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
        
        const change = previousAvg !== 0 
            ? ((recentAvg - previousAvg) / previousAvg) * 100
            : 0;
        
        let trend = 'neutral';
        if (change > 5) trend = 'up';
        else if (change < -5) trend = 'down';
        
        return {
            trend,
            change: Number(change.toFixed(2)),
            recentAvg: Number(recentAvg.toFixed(2)),
            previousAvg: Number(previousAvg.toFixed(2))
        };
    }
    
    /**
     * Calcula regressão linear
     * @param {Array} points - [{x, y}]
     * @returns {Object} - {slope, intercept, r2}
     */
    linearRegression(points) {
        const n = points.length;
        if (n < 2) return null;
        
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // R² (coeficiente de determinação)
        const yMean = sumY / n;
        const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
        const ssRes = points.reduce((sum, p) => {
            const predicted = slope * p.x + intercept;
            return sum + Math.pow(p.y - predicted, 2);
        }, 0);
        const r2 = 1 - (ssRes / ssTotal);
        
        return {
            slope: Number(slope.toFixed(4)),
            intercept: Number(intercept.toFixed(2)),
            r2: Number(r2.toFixed(4))
        };
    }

    // ==================== ANOMALIAS ====================
    
    /**
     * Encontra anomalias usando Z-score
     * @param {Array} data - Array de objetos
     * @param {String} key - Chave para análise
     * @param {Number} threshold - Limiar Z-score (padrão 2)
     * @returns {Array} - Itens anômalos
     */
    findAnomalies(data, key, threshold = 2) {
        const stats = this.calculateStats(data, key);
        if (!stats) return [];
        
        return data.filter(item => {
            const value = parseFloat(item[key]) || 0;
            const zScore = Math.abs((value - stats.mean) / stats.stdDev);
            return zScore > threshold;
        }).map(item => ({
            ...item,
            zScore: Math.abs((parseFloat(item[key]) - stats.mean) / stats.stdDev).toFixed(2)
        }));
    }

    // ==================== KPIS ====================
    
    /**
     * Calcula eficiência (recebidos - segregados) / recebidos
     */
    calculateEfficiency(received, segregated) {
        if (!received || received === 0) return 0;
        return Number((((received - segregated) / received) * 100).toFixed(2));
    }
    
    /**
     * Calcula taxa de conclusão
     */
    calculateCompletionRate(total, completed) {
        if (!total || total === 0) return 0;
        return Number(((completed / total) * 100).toFixed(2));
    }
    
    /**
     * Calcula crescimento percentual
     */
    calculateGrowth(current, previous) {
        if (!previous || previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(2));
    }

    // ==================== INSIGHTS AUTOMÁTICOS ====================
    
    /**
     * Gera insights automáticos baseados em métricas
     * @param {String} module - Nome do módulo
     * @param {Object} metrics - Métricas calculadas
     * @returns {Array} - Array de insights {type, icon, message}
     */
    generateInsights(module, metrics) {
        const insights = [];
        
        // Análise de tendência
        if (metrics.trend) {
            if (metrics.trend.trend === 'up') {
                insights.push({
                    type: 'positive',
                    icon: '📈',
                    message: `Tendência positiva detectada: +${metrics.trend.change}%`
                });
            } else if (metrics.trend.trend === 'down') {
                insights.push({
                    type: 'warning',
                    icon: '📉',
                    message: `Atenção: Tendência negativa de ${metrics.trend.change}%`
                });
            }
        }
        
        // Análise de eficiência
        if (metrics.efficiency !== undefined) {
            if (metrics.efficiency >= 95) {
                insights.push({
                    type: 'success',
                    icon: '🟢',
                    message: `Excelente eficiência: ${metrics.efficiency.toFixed(1)}%`
                });
            } else if (metrics.efficiency < 85) {
                insights.push({
                    type: 'danger',
                    icon: '🔴',
                    message: `Eficiência crítica: ${metrics.efficiency.toFixed(1)}% - Ação necessária!`
                });
            } else {
                insights.push({
                    type: 'warning',
                    icon: '🟡',
                    message: `Eficiência atenção: ${metrics.efficiency.toFixed(1)}% - Melhorias possíveis`
                });
            }
        }
        
        // Análise de volume/total
        if (metrics.total !== undefined) {
            if (metrics.total === 0) {
                insights.push({
                    type: 'info',
                    icon: 'ℹ️',
                    message: 'Nenhum dado disponível para análise. Importe dados primeiro.'
                });
            } else if (metrics.total > 100) {
                insights.push({
                    type: 'info',
                    icon: '📊',
                    message: `Grande volume de dados: ${metrics.total} registros analisados`
                });
            }
        }
        
        // Análise de crescimento
        if (metrics.growth !== undefined) {
            if (Math.abs(metrics.growth) > 20) {
                const direction = metrics.growth > 0 ? 'aumento' : 'redução';
                insights.push({
                    type: metrics.growth > 0 ? 'positive' : 'warning',
                    icon: metrics.growth > 0 ? '⬆️' : '⬇️',
                    message: `${direction} significativo: ${Math.abs(metrics.growth)}%`
                });
            }
        }
        
        return insights;
    }
    
    /**
     * Detecta problemas e gera alertas
     */
    detectIssues(metrics, thresholds) {
        const issues = [];
        
        for (const [key, value] of Object.entries(metrics)) {
            if (thresholds[key]) {
                const { min, max } = thresholds[key];
                if (min !== undefined && value < min) {
                    issues.push({
                        metric: key,
                        value,
                        expected: `>= ${min}`,
                        severity: 'high'
                    });
                }
                if (max !== undefined && value > max) {
                    issues.push({
                        metric: key,
                        value,
                        expected: `<= ${max}`,
                        severity: 'medium'
                    });
                }
            }
        }
        
        return issues;
    }

    // ==================== UTILITÁRIOS ====================
    
    /**
     * Formata número como moeda
     */
    formatCurrency(value, currency = 'EUR') {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: currency
        }).format(value);
    }
    
    /**
     * Formata percentual
     */
    formatPercent(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }
    
    /**
     * Formata número grande com separadores
     */
    formatNumber(value) {
        return new Intl.NumberFormat('pt-PT').format(value);
    }
}

// Export para uso no app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsEngine;
}
