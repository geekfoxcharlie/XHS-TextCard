/**
 * App - 项目核心调度器
 * 
 * 设计原则：
 * 1. 业务逻辑编排：作为 Entry Point，负责协调 TemplateManager, PreviewGenerator, 
 *    DownloadManager 和 EditorController 之间的交互。
 * 2. 状态管理：维护当前模板、配置及分发后的页面数据。
 * 3. 响应式更新：处理输入抖动 (Debounce)，确保 UI 响应流畅。
 */
class App {
    constructor() {
        this.templateManager = new TemplateManager();
        this.previewGenerator = new PreviewGenerator(this.templateManager);
        this.downloadManager = new DownloadManager();
        this.editorController = new EditorController();

        this.currentTemplate = 'ios-memo';
        this.currentTemplateConfig = null;
        this.splitPages = [];
        
        this.elements = {};
        this.debounceTimer = null;
        this.shouldScrollToStart = false;
    }

    init() {
        if (typeof MarkdownParser !== 'undefined') {
            MarkdownParser.init();
        }
        this.initElements();
        this.bindEvents();
        this.loadTemplates();
        this.setDefaultText();
    }

    async setDefaultText() {
        try {
            const response = await fetch('data/default-text.md');
            const text = await response.text();
            this.elements.textInput.value = text;
        } catch (error) {
            console.error('Failed to load default text:', error);
            this.elements.textInput.value = '加载默认文本失败，请刷新页面重试。';
        }
    }

    initElements() {
        this.elements = {
            textInput: document.getElementById('text-input'),
            templateList: document.getElementById('template-list'),
            downloadAllBtn: document.getElementById('download-all-btn'),
            previewList: document.getElementById('preview-list'),
            previewCount: document.getElementById('preview-count'),
            previewIndicators: document.getElementById('preview-indicators'),
            previewPrev: document.getElementById('preview-prev'),
            previewNext: document.getElementById('preview-next'),
            loading: document.getElementById('loading'),
            visualEditor: document.getElementById('visual-editor'),
            coverEditor: document.getElementById('cover-editor'),
            editorTabs: document.querySelectorAll('.editor-tab'),
            fontSizeInput: document.getElementById('font-size'),
            fontSizeValue: document.getElementById('font-size-value'),
            lineHeightInput: document.getElementById('line-height'),
            lineHeightValue: document.getElementById('line-height-value'),
            letterSpacingInput: document.getElementById('letter-spacing'),
            letterSpacingValue: document.getElementById('letter-spacing-value'),
            textPaddingInput: document.getElementById('text-padding'),
            textPaddingValue: document.getElementById('text-padding-value'),
            fontFamilySelect: document.getElementById('font-family'),
            h1ScaleValue: document.getElementById('h1-scale-value'),
            h2ScaleValue: document.getElementById('h2-scale-value'),
            h3ScaleValue: document.getElementById('h3-scale-value'),
            resetTemplateBtn: document.getElementById('reset-template-btn'),
            hasWatermarkCheck: document.getElementById('has-watermark'),
            watermarkTextInput: document.getElementById('watermark-text'),
            hasSignatureCheck: document.getElementById('has-signature'),
            signatureTextInput: document.getElementById('signature-text'),
            hasCoverCheck: document.getElementById('has-cover'),
            coverTitleInput: document.getElementById('cover-title'),
            coverFontSizeInput: document.getElementById('cover-font-size')
        };

        this.downloadManager.setLoadingElement(this.elements.loading);
        this.editorController.init(this.elements);
        this.editorController.setOnConfigChange((config) => {
            // 如果开启了封面，且之前是关闭状态，标记需要滚动到开始位置
            if (config.hasCover && (!this.currentTemplateConfig || !this.currentTemplateConfig.hasCover)) {
                this.shouldScrollToStart = true;
            }

            this.currentTemplateConfig = { ...config };
            
            // 实时保存当前模板配置到本地（排除 coverImage，避免 LocalStorage 超限）
            if (this.currentTemplate) {
                const { coverImage, ...safeConfig } = config;
                localStorage.setItem(`xhs_tpl_config_${this.currentTemplate}`, JSON.stringify(safeConfig));
            }
            
            this.generatePreview();
        });
    }

    bindEvents() {
        this.elements.textInput.addEventListener('input', () => this.schedulePreview(300));
        this.elements.downloadAllBtn.addEventListener('click', () => this.downloadAllImages());
        this.elements.resetTemplateBtn.addEventListener('click', () => this.resetTemplate());
        this.elements.previewList.addEventListener('scroll', () => this.updateActiveIndicator());

        this.elements.previewPrev.addEventListener('click', () => {
            this.elements.previewList.scrollLeft -= this.elements.previewList.clientWidth;
        });

        this.elements.previewNext.addEventListener('click', () => {
            this.elements.previewList.scrollLeft += this.elements.previewList.clientWidth;
        });
    }

    updateActiveIndicator() {
        if (!this.elements.previewIndicators) return;
        
        const scrollLeft = this.elements.previewList.scrollLeft;
        const width = this.elements.previewList.clientWidth;
        const index = Math.round(scrollLeft / width);
        
        const indicators = this.elements.previewIndicators.querySelectorAll('.preview-indicator');
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });

        if (this.elements.previewPrev) {
            this.elements.previewPrev.disabled = scrollLeft <= 0;
        }
        if (this.elements.previewNext) {
            const maxScroll = this.elements.previewList.scrollWidth - this.elements.previewList.clientWidth;
            this.elements.previewNext.disabled = scrollLeft >= maxScroll - 5;
        }
    }

    renderIndicators(count) {
        if (!this.elements.previewIndicators) return;
        this.elements.previewIndicators.innerHTML = '';
        if (count <= 1) return;

        for (let i = 0; i < count; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'preview-indicator';
            if (i === 0) indicator.classList.add('active');
            this.elements.previewIndicators.appendChild(indicator);
        }
    }

    schedulePreview(delay = DEFAULT_DEBOUNCE_DELAY) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.generatePreview(), delay);
    }

    async loadTemplates() {
        await this.templateManager.init();
        this.renderTemplateList();
        await this.selectTemplate('ios-memo');
    }

    renderTemplateList() {
        this.elements.templateList.innerHTML = '';
        const templates = this.templateManager.getAllTemplates();

        templates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'template-item';
            if (template.id === this.currentTemplate) item.classList.add('active');

            const name = document.createElement('div');
            name.className = 'template-item-name';
            name.textContent = template.name;
            
            const desc = document.createElement('div');
            desc.className = 'template-item-desc';
            desc.textContent = template.description;

            item.appendChild(name);
            item.appendChild(desc);
            item.addEventListener('click', () => this.selectTemplate(template.id));
            this.elements.templateList.appendChild(item);
        });
    }

    async selectTemplate(templateId) {
        const template = await this.templateManager.loadTemplate(templateId);
        if (!template) return;

        this.currentTemplate = templateId;
        
        // 尝试从本地存储加载用户自定义配置
        const savedConfig = localStorage.getItem(`xhs_tpl_config_${templateId}`);
        if (savedConfig) {
            try {
                this.currentTemplateConfig = { ...template.config, ...JSON.parse(savedConfig) };
            } catch (e) {
                this.currentTemplateConfig = { ...template.config };
            }
        } else {
            this.currentTemplateConfig = { ...template.config };
        }

        this.renderTemplateList();
        this.editorController.setConfig(this.currentTemplateConfig);
        this.generatePreview();
    }

    async generatePreview() {
        const text = this.elements.textInput.value.trim();
        if (!text) {
            this.showEmptyState('请输入文字内容');
            this.elements.previewCount.textContent = '共 0 张图片';
            this.elements.downloadAllBtn.disabled = true;
            this.splitPages = [];
            this.renderIndicators(0);
            return;
        }

        if (!this.currentTemplateConfig) return;

        const scrollLeft = this.elements.previewList.scrollLeft;
        this.elements.loading.classList.add('active');
        // 不立即清空，防止闪烁，等到新内容准备好再替换
        // this.elements.previewList.innerHTML = ''; 

        const splitter = new TextSplitter(this.currentTemplateConfig, this.currentTemplate);
        this.splitPages = await splitter.split(text);

        this.elements.previewCount.textContent = `共 ${this.splitPages.length} 张图片`;

        if (this.splitPages.length === 0) {
            this.elements.previewList.innerHTML = '';
            this.showEmptyState('没有可生成的内容');
            this.elements.loading.classList.remove('active');
            this.elements.downloadAllBtn.disabled = true;
            this.renderIndicators(0);
            return;
        }

        this.elements.downloadAllBtn.disabled = false;
        this.renderIndicators(this.splitPages.length);

        const renderPromises = this.splitPages.map(async (pageLayouts, index) => {
            const previewItem = await this.previewGenerator.createPreviewItem(
                pageLayouts,
                index,
                this.splitPages.length,
                this.currentTemplate,
                this.currentTemplateConfig,
                (idx) => this.downloadSingleImage(idx)
            );
            return previewItem;
        });

        const items = await Promise.all(renderPromises);
        
        // 渲染完成后一次性更新 DOM
        this.elements.previewList.innerHTML = '';
        items.forEach(item => this.elements.previewList.appendChild(item));
        this.elements.loading.classList.remove('active');
        
        requestAnimationFrame(() => {
            if (this.shouldScrollToStart) {
                this.elements.previewList.scrollLeft = 0;
                this.shouldScrollToStart = false;
            } else {
                this.elements.previewList.scrollLeft = scrollLeft;
            }
            this.updateActiveIndicator();
        });
    }

    showEmptyState(message) {
        this.elements.previewList.innerHTML = '';
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        const icon = document.createElement('div');
        icon.className = 'empty-state-icon';
        icon.textContent = '📝';
        
        const text = document.createElement('div');
        text.textContent = message;
        
        emptyState.appendChild(icon);
        emptyState.appendChild(text);
        this.elements.previewList.appendChild(emptyState);
    }

    downloadSingleImage(index) {
        this.downloadManager.download(this.splitPages[index], this.currentTemplateConfig, this.currentTemplate, index, this.splitPages.length);
    }

    downloadAllImages() {
        this.downloadManager.downloadAll(this.splitPages, this.currentTemplateConfig, this.currentTemplate, this.elements.downloadAllBtn);
    }

    resetTemplate() {
        const template = this.templateManager.getTemplate(this.currentTemplate);
        if (template) {
            localStorage.removeItem(`xhs_tpl_config_${this.currentTemplate}`);
            this.currentTemplateConfig = { ...template.config };
            this.editorController.setConfig(this.currentTemplateConfig);
            this.generatePreview();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
