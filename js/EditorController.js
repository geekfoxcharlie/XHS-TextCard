/**
 * EditorController - 侧边栏编辑面板控制器
 * 
 * 设计原则：
 * 1. 数据驱动 UI：UI 控件的状态始终通过 currentConfig 同步，不直接操作 DOM 存储数据。
 * 2. 交互一致性：通过 configMap 映射控件类型与事件，减少重复逻辑。
 * 3. 颜色管理：集成 Pickr 取色器，并支持 Solid 与 Gradient 模式的无缝切换。
 */
class EditorController {
    constructor() {
        this.elements = {};
        this.currentConfig = null;
        this.onConfigChange = null;
        this.pickrs = {};
        this.lastSolidColor = '#ffffff';
        this.lastGradientColor = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        
        this.swatches = [
            '#ffffff', '#E8D5C4', '#B5C0D0', '#CCD3CA', '#F5E8DD', '#9290C3', '#7C9D96', 
            '#1a1a1b', '#333333', '#000000', '#495057', '#1c7ed6', '#d6336c', '#37b24d', '#f08c00'
        ];

        // 配置映射表：键名, 控件类型, 类型转换
        this.configMap = [
            { key: 'fontSize', type: 'range', isInt: true },
            { key: 'lineHeight', type: 'range', isFloat: true },
            { key: 'letterSpacing', type: 'range', isFloat: true },
            { key: 'textPadding', type: 'range', isInt: true },
            { key: 'fontFamily', type: 'select' },
            { key: 'hasWatermark', type: 'checkbox', toggle: '.watermark-options' },
            { key: 'watermarkText', type: 'input' },
            { key: 'hasSignature', type: 'checkbox', toggle: '#signature-options' },
            { key: 'signatureText', type: 'input' },
            { key: 'showGrid', type: 'checkbox' },
            { key: 'h1Scale', type: 'range', isFloat: true },
            { key: 'h2Scale', type: 'range', isFloat: true },
            { key: 'h3Scale', type: 'range', isFloat: true },
            { key: 'hasCover', type: 'checkbox', toggle: '#cover-options' },
            { key: 'coverTitle', type: 'input' },
            { key: 'coverFontSize', type: 'range', isInt: true }
        ];
    }

    init(elements) {
        this.elements = elements;
        if (typeof Pickr === 'undefined') {
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
            console.error('EditorController init failed:', error);
        }
    }

    /**
     * 初始化所有颜色取色器
     */
    initPickrs() {
        const pickrConfigs = [
            { id: '#bg-color-picker', key: 'bgColor', default: '#ffffff', type: 'bg' },
            { id: '#text-color-picker', key: 'textColor', default: '#333333', type: 'text' },
            { id: '#gradient-start-picker', key: 'gradStart', default: '#f5f7fa', type: 'grad' },
            { id: '#gradient-end-picker', key: 'gradEnd', default: '#c3cfe2', type: 'grad' },
            { id: '#watermark-color-picker', key: 'watermarkColor', default: 'rgba(0,0,0,0.1)', type: 'rgba' },
            { id: '#signature-color-picker', key: 'signatureColor', default: '#555555', type: 'rgba' },
            { id: '#accent-color-picker', key: 'accentColor', default: null, type: 'text' }
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
                        this.lastSolidColor = hex;
                        this.updateActivePreset('bg-color', hex);
                    } else if (cfg.type === 'text') {
                        this.updateActivePreset('text-color', hex);
                    }
                }
                this.notifyConfigChange();
            });
        });
    }

    createPickr(el, defaultColor, onChange) {
        return Pickr.create({
            el: el, theme: 'monolith', default: defaultColor, swatches: this.swatches,
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

    /**
     * 渐变编辑器弹窗逻辑
     */
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
        
        document.getElementById('gradient-angle')?.addEventListener('input', (e) => {
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

    /**
     * 解析现有 CSS 渐变字符串并同步到控件
     */
    parseCurrentGradient() {
        const bg = this.currentConfig.bgColor;
        if (!bg || typeof bg !== 'string' || !bg.startsWith('linear-gradient')) return;
        
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
        const gradString = `linear-gradient(${deg}deg, ${start} 0%, ${end} 100%)`;
        this.currentConfig.bgColor = gradString;
        this.lastGradientColor = gradString;
        this.currentConfig.bgMode = 'gradient';
        this.notifyConfigChange();
    }

    initBgModeSelector() {
        document.querySelectorAll('.bg-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setBgMode(btn.dataset.mode);
                this.notifyConfigChange();
            });
        });
    }

    setBgMode(mode) {
        document.querySelectorAll('.bg-mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
        
        const solidPresets = document.querySelector('.solid-presets');
        const gradientPresets = document.querySelector('.gradient-presets');
        const bgPickrRoot = document.querySelector('#bg-color-picker-container .pickr');
        
        if (solidPresets) solidPresets.style.display = mode === 'solid' ? 'flex' : 'none';
        if (gradientPresets) gradientPresets.style.display = mode === 'gradient' ? 'flex' : 'none';
        if (bgPickrRoot) bgPickrRoot.style.display = mode === 'solid' ? 'block' : 'none';
        
        const gradientPanel = document.getElementById('gradient-editor-panel');
        if (gradientPanel) gradientPanel.style.display = 'none';

        if (this.currentConfig) {
            this.currentConfig.bgMode = mode;
            const isCurrentGrad = typeof this.currentConfig.bgColor === 'string' && this.currentConfig.bgColor.includes('linear-gradient');
            if (mode === 'solid' && isCurrentGrad) {
                this.currentConfig.bgColor = this.lastSolidColor || '#ffffff';
            } else if (mode === 'gradient' && !isCurrentGrad) {
                this.currentConfig.bgColor = this.lastGradientColor || 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
            }
        }
    }

    bindEvents() {
        this.elements.editorTabs?.forEach(tab => {
            tab.addEventListener('click', () => {
                this.elements.editorTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.elements.visualEditor?.classList.toggle('active', tab.dataset.tab === 'visual');
            });
        });

        const presetGroups = [{ container: '#bg-color-presets', type: 'bg' }, { container: '#text-color-presets', type: 'text' }];
        presetGroups.forEach(group => {
            document.querySelectorAll(`${group.container} .color-preset`).forEach(preset => {
                preset.addEventListener('click', () => {
                    const color = preset.dataset.color;
                    if (!this.currentConfig) return;

                    if (group.type === 'bg') {
                        const isGrad = color.startsWith('linear-gradient');
                        this.currentConfig.bgMode = isGrad ? 'gradient' : 'solid';
                        this.setBgMode(this.currentConfig.bgMode);
                        if (isGrad) {
                            this.lastGradientColor = color;
                        } else {
                            this.pickrs.bgColor?.setColor(color);
                            this.lastSolidColor = color;
                        }
                        this.updateActivePreset('bg-color', color);
                    } else {
                        this.pickrs.textColor?.setColor(color);
                        this.updateActivePreset('text-color', color);
                    }

                    this.currentConfig[group.type === 'bg' ? 'bgColor' : 'textColor'] = color;
                    this.notifyConfigChange();
                });
            });
        });

        this.configMap.forEach(cfg => {
            const el = this.getControlElement(cfg);
            if (!el) return;
            const eventType = (cfg.type === 'range' || cfg.type === 'input') ? 'input' : 'change';
            el.addEventListener(eventType, (e) => {
                const val = cfg.type === 'checkbox' ? e.target.checked : e.target.value;
                this.updateConfigAndNotify(cfg, val);
            });
        });

        // 封面图片上传逻辑
        const uploadBtn = document.getElementById('upload-cover-btn');
        const fileInput = document.getElementById('cover-image-input');
        const fileNameHint = document.getElementById('cover-file-name');

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    alert('图片大小不能超过 5MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    this.currentConfig.coverImage = dataUrl;
                    if (fileNameHint) fileNameHint.textContent = file.name;
                    this.notifyConfigChange();
                };
                reader.readAsDataURL(file);
            });
        }
    }

    updateConfigAndNotify(cfg, rawValue) {
        let val = rawValue;
        if (cfg.isInt) val = parseInt(val) || 0;
        if (cfg.isFloat) val = parseFloat(val) || 0;

        this.currentConfig[cfg.key] = val;
        this.updateUIControl(cfg, val);
        this.notifyConfigChange();
    }

    getControlElement(cfg) {
        if (this.elements[cfg.key + 'Input']) return this.elements[cfg.key + 'Input'];
        if (this.elements[cfg.key + 'Check']) return this.elements[cfg.key + 'Check'];
        if (this.elements[cfg.key + 'Select']) return this.elements[cfg.key + 'Select'];
        const fallbackId = cfg.key.replace(/([A-Z])/g, "-$1").toLowerCase();
        return document.getElementById(fallbackId);
    }

    updateUIControl(cfg, val) {
        // 尝试从 elements 获取 label，如果不存在则通过 ID 查找
        let label = this.elements[cfg.key + 'Value'];
        if (!label) {
            const labelId = cfg.key.replace(/([A-Z])/g, "-$1").toLowerCase() + '-value';
            label = document.getElementById(labelId);
        }

        let displayVal = val;
        if (['fontSize', 'textPadding', 'letterSpacing', 'coverFontSize'].includes(cfg.key)) displayVal = val + 'px';
        else if (cfg.key.endsWith('Scale')) displayVal = val + 'x';
        
        if (label) label.textContent = displayVal;
        if (cfg.type === 'checkbox' && cfg.toggle) {
            document.querySelectorAll(cfg.toggle).forEach(node => { node.style.display = val ? 'flex' : 'none'; });
        }
    }

    /**
     * 设置全量配置并同步到 UI
     */
    setConfig(config) {
        this.currentConfig = { ...config };
        if (config.bgColor) {
            if (config.bgColor.startsWith('linear-gradient')) this.lastGradientColor = config.bgColor;
            else this.lastSolidColor = config.bgColor;
        }
        
        this.updateEditorFromConfig();
        
        if (config.bgColor) {
            this.updateActivePreset('bg-color', config.bgColor);
            if (!config.bgColor.startsWith('linear-gradient')) this.pickrs.bgColor?.setColor(config.bgColor);
        }
        if (config.textColor) {
            this.updateActivePreset('text-color', config.textColor);
            this.pickrs.textColor?.setColor(config.textColor);
        }
        if (config.watermarkColor) this.pickrs.watermarkColor?.setColor(config.watermarkColor);
        if (config.signatureColor) this.pickrs.signatureColor?.setColor(config.signatureColor);
        if (config.accentColor) this.pickrs.accentColor?.setColor(config.accentColor);
        
        // 更新封面图片提示
        const fileNameHint = document.getElementById('cover-file-name');
        if (fileNameHint) {
            const isCustom = config.coverImage && config.coverImage.startsWith('data:');
            fileNameHint.textContent = isCustom ? '已上传自定义图片' : '默认背景';
        }
    }

    updateActivePreset(type, color) {
        if (!color) return;
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
            }
            this.updateUIControl(cfg, val);
        });
    }

    setOnConfigChange(callback) { this.onConfigChange = callback; }
    notifyConfigChange() { if (this.onConfigChange) this.onConfigChange(this.currentConfig); }
}
