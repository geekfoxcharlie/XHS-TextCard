/**
 * EditorController
 * 模板编辑器控制器 - 负责模板参数的交互与同步
 * @version 1.0
 */
class EditorController {
    constructor() {
        this.elements = {};
        this.currentConfig = null;
        this.onConfigChange = null;
        this.pickrs = {};
        
        // 莫兰迪色系预设
        this.swatches = [
            '#ffffff', '#E8D5C4', '#B5C0D0', '#CCD3CA', 
            '#F5E8DD', '#9290C3', '#7C9D96', '#1a1a1b',
            '#333333', '#000000', '#495057', '#1c7ed6',
            '#d6336c', '#37b24d', '#f08c00'
        ];

        // 核心配置项映射，用于自动化绑定和更新
        this.configMap = [
            { key: 'fontSize', type: 'range', isInt: true },
            { key: 'lineHeight', type: 'range', isFloat: true },
            { key: 'letterSpacing', type: 'range', isFloat: true },
            { key: 'textPadding', type: 'range', isInt: true },
            { key: 'fontFamily', type: 'select' },
            { key: 'hasWatermark', type: 'checkbox', toggle: '.watermark-options' },
            { key: 'watermarkText', type: 'input' },
            { key: 'hasSignature', type: 'checkbox', toggle: '#signature-options' },
            { key: 'signatureText', type: 'input' }
        ];
    }

    init(elements) {
        this.elements = elements;
        
        if (typeof Pickr === 'undefined') {
            console.error('Pickr library not loaded!');
            this.initBgModeSelector();
            this.bindEvents();
            return;
        }

        try {
            this.initPickrs();
            this.initBgModeSelector();
            this.initGradientEditor();
            this.bindEvents();
        } catch (error) {
            console.error('Error during EditorController init:', error);
        }
    }

    initPickrs() {
        const pickrConfigs = [
            { id: '#bg-color-picker', key: 'bgColor', default: '#ffffff', type: 'bg' },
            { id: '#text-color-picker', key: 'textColor', default: '#333333', type: 'text' },
            { id: '#gradient-start-picker', key: 'gradStart', default: '#f5f7fa', type: 'grad' },
            { id: '#gradient-end-picker', key: 'gradEnd', default: '#c3cfe2', type: 'grad' },
            { id: '#watermark-color-picker', key: 'watermarkColor', default: 'rgba(0,0,0,0.1)', type: 'rgba' },
            { id: '#signature-color-picker', key: 'signatureColor', default: '#555555', type: 'rgba' }
        ];

        pickrConfigs.forEach(cfg => {
            this.pickrs[cfg.key] = this.createPickr(cfg.id, cfg.default, (color) => {
                if (cfg.type === 'rgba') {
                    this.currentConfig[cfg.key] = color.toRGBA().toString(3);
                } else if (cfg.type === 'grad') {
                    this.updateGradientFromPickrs();
                } else {
                    const hex = color.toHEXA().toString();
                    this.currentConfig[cfg.key] = hex;
                    if (cfg.type === 'bg') {
                        this.currentConfig.bgMode = 'solid';
                        this.updateActivePreset('bg-color', hex);
                    } else if (cfg.type === 'text') {
                        this.updateActivePreset('text-color', hex);
                    }
                }
                this.notifyConfigChange(false);
            });
        });
    }

    createPickr(el, defaultColor, onChange) {
        return Pickr.create({
            el: el,
            theme: 'monolith',
            default: defaultColor,
            swatches: this.swatches,
            components: {
                preview: true, opacity: true, hue: true,
                interaction: { hex: true, rgba: true, input: true, save: true }
            },
            strings: { save: '确定' }
        }).on('save', (color, instance) => {
            onChange(color);
            instance.hide();
        });
    }

    initGradientEditor() {
        const plusBtn = document.querySelector('#bg-color-picker-container .fa-plus');
        const popup = document.getElementById('gradient-editor-panel');
        if (!plusBtn || !popup) return;

        plusBtn.parentNode.addEventListener('click', (e) => {
            if (this.currentConfig?.bgMode === 'gradient') {
                e.stopPropagation();
                popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
                if (popup.style.display === 'block') this.parseCurrentGradient();
            }
        });

        popup.querySelector('.close-popup')?.addEventListener('click', () => popup.style.display = 'none');
        
        const angleInput = document.getElementById('gradient-angle');
        angleInput?.addEventListener('input', (e) => {
            const deg = e.target.value;
            const label = document.getElementById('gradient-angle-value');
            if (label) label.textContent = deg + 'deg';
            this.updateGradientFromPickrs();
        });

        document.addEventListener('click', (e) => {
            if (!popup.contains(e.target) && !plusBtn.parentNode.contains(e.target) && !e.target.closest('.pcr-app')) {
                popup.style.display = 'none';
            }
        });
    }

    parseCurrentGradient() {
        const bg = this.currentConfig.bgColor;
        if (!bg.startsWith('linear-gradient')) return;
        
        const colors = bg.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\(.*?\)/g);
        if (colors?.length >= 2) {
            this.pickrs.gradStart.setColor(colors[0]);
            this.pickrs.gradEnd.setColor(colors[colors.length - 1]);
        }
        const angleMatch = bg.match(/(\d+)deg/);
        if (angleMatch) {
            const angleInput = document.getElementById('gradient-angle');
            if (angleInput) angleInput.value = angleMatch[1];
            const label = document.getElementById('gradient-angle-value');
            if (label) label.textContent = angleMatch[0];
        }
    }

    updateGradientFromPickrs() {
        const start = this.pickrs.gradStart.getColor().toHEXA().toString();
        const end = this.pickrs.gradEnd.getColor().toHEXA().toString();
        const deg = document.getElementById('gradient-angle')?.value || 135;
        this.currentConfig.bgColor = `linear-gradient(${deg}deg, ${start} 0%, ${end} 100%)`;
        this.currentConfig.bgMode = 'gradient';
        this.notifyConfigChange(false);
    }

    initBgModeSelector() {
        document.querySelectorAll('.bg-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setBgMode(btn.dataset.mode);
                this.notifyConfigChange(false);
            });
        });
    }

    setBgMode(mode) {
        document.querySelectorAll('.bg-mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
        
        const solidPresets = document.querySelector('.solid-presets');
        const gradientPresets = document.querySelector('.gradient-presets');
        const bgPickerPlus = document.querySelector('#bg-color-picker-container .fa-plus');
        const bgPickrRoot = document.querySelector('#bg-color-picker-container .pickr');
        
        if (solidPresets) solidPresets.style.display = mode === 'solid' ? 'flex' : 'none';
        if (gradientPresets) gradientPresets.style.display = mode === 'gradient' ? 'flex' : 'none';
        if (bgPickerPlus) bgPickerPlus.style.display = 'block';
        if (bgPickrRoot) bgPickrRoot.style.display = mode === 'solid' ? 'block' : 'none';
        
        const gradientPanel = document.getElementById('gradient-editor-panel');
        if (gradientPanel) gradientPanel.style.display = 'none';

        if (this.currentConfig) this.currentConfig.bgMode = mode;
    }

    bindEvents() {
        // 编辑器标签切换
        this.elements.editorTabs?.forEach(tab => {
            tab.addEventListener('click', () => {
                this.elements.editorTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.elements.visualEditor?.classList.toggle('active', tab.dataset.tab === 'visual');
            });
        });

        // 颜色预设
        const presetGroups = [
            { container: '#bg-color-presets', type: 'bg' },
            { container: '#text-color-presets', type: 'text' }
        ];

        presetGroups.forEach(group => {
            document.querySelectorAll(`${group.container} .color-preset`).forEach(preset => {
                preset.addEventListener('click', () => {
                    const color = preset.dataset.color;
                    if (!this.currentConfig) return;

                    if (group.type === 'bg') {
                        const isGrad = color.startsWith('linear-gradient');
                        this.currentConfig.bgMode = isGrad ? 'gradient' : 'solid';
                        if (!isGrad) this.pickrs.bg?.setColor(color);
                        this.updateActivePreset('bg-color', color);
                    } else {
                        this.pickrs.text?.setColor(color);
                        this.updateActivePreset('text-color', color);
                    }

                    this.currentConfig[group.type === 'bg' ? 'bgColor' : 'textColor'] = color;
                    this.notifyConfigChange(false);
                });
            });
        });

        // 简化：所有配置变更都触发重新分页
        this.configMap.forEach(cfg => {
            const el = this.getControlElement(cfg);
            if (!el) return;

            const eventType = cfg.type === 'range' ? 'change' : (cfg.type === 'checkbox' || cfg.type === 'select' ? 'change' : 'input');
            el.addEventListener(eventType, (e) => {
                const val = cfg.type === 'checkbox' ? e.target.checked : e.target.value;
                this.updateConfigAndNotify(cfg, val);
            });
        });
    }

    updateConfigAndNotify(cfg, rawValue) {
        let val = rawValue;
        if (cfg.isInt) val = parseInt(val);
        if (cfg.isFloat) val = parseFloat(val);

        this.currentConfig[cfg.key] = val;
        this.updateUIControl(cfg, val);
        this.notifyConfigChange();
    }

    getControlElement(cfg) {
        // 尝试从 this.elements 获取，或直接从 DOM 获取
        const camelName = cfg.key.charAt(0).toUpperCase() + cfg.key.slice(1);
        return this.elements[cfg.key + (cfg.type === 'input' ? 'Input' : camelName.replace('Has', 'Check').replace('Font', 'Select'))] 
            || this.elements[cfg.key + 'Input']
            || this.elements[cfg.key + 'Select']
            || document.getElementById(cfg.key.replace(/([A-Z])/g, "-$1").toLowerCase());
    }

    updateUIControl(cfg, val) {
        // 更新数值标签
        const label = this.elements[cfg.key + 'Value'];
        if (label) label.textContent = val + (cfg.key === 'lineHeight' ? '' : 'px');

        // 处理显示隐藏切换
        if (cfg.type === 'checkbox' && cfg.toggle) {
            document.querySelectorAll(cfg.toggle).forEach(node => {
                node.style.display = val ? 'flex' : 'none';
            });
        }
    }

    setConfig(config) {
        this.currentConfig = { ...config }; // 使用浅拷贝防止污染原始数据
        this.updateEditorFromConfig();
        
        if (config.bgColor) {
            this.updateActivePreset('bg-color', config.bgColor);
            if (!config.bgColor.startsWith('linear-gradient')) this.pickrs.bg?.setColor(config.bgColor);
        }
        if (config.textColor) {
            this.updateActivePreset('text-color', config.textColor);
            this.pickrs.text?.setColor(config.textColor);
        }
        if (config.watermarkColor) this.pickrs.watermark?.setColor(config.watermarkColor);
        if (config.signatureColor) this.pickrs.signature?.setColor(config.signatureColor);
    }

    updateActivePreset(type, color) {
        const containerId = type === 'bg-color' ? 'bg-color-presets' : 'text-color-presets';
        document.querySelectorAll(`#${containerId} .color-preset`).forEach(p => {
            p.classList.toggle('active', p.dataset.color.toLowerCase() === color.toLowerCase());
        });
    }

    updateEditorFromConfig() {
        if (!this.currentConfig) return;

        this.setBgMode(this.currentConfig.bgMode || 'solid');

        this.configMap.forEach(cfg => {
            const el = this.getControlElement(cfg);
            const val = this.currentConfig[cfg.key];
            if (el) {
                if (cfg.type === 'checkbox') el.checked = !!val;
                else el.value = val || '';
            } else {
                console.warn('Element not found for:', cfg.key, 'looking for:', cfg.key.replace(/([A-Z])/g, "-$1").toLowerCase());
            }
            this.updateUIControl(cfg, val);
        });
    }

    setOnConfigChange(callback) { this.onConfigChange = callback; }

    notifyConfigChange() {
        if (this.onConfigChange) this.onConfigChange(this.currentConfig);
    }
}
