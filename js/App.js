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
            console.error('加载默认文本失败:', error);
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
            editorTabs: document.querySelectorAll('.editor-tab'),
            fontSizeInput: document.getElementById('font-size'),
            lineHeightInput: document.getElementById('line-height'),
            letterSpacingInput: document.getElementById('letter-spacing'),
            textPaddingInput: document.getElementById('text-padding'),
            fontFamilySelect: document.getElementById('font-family'),
            resetTemplateBtn: document.getElementById('reset-template-btn'),
            hasWatermarkCheck: document.getElementById('has-watermark'),
            watermarkTextInput: document.getElementById('watermark-text'),
            hasSignatureCheck: document.getElementById('has-signature'),
            signatureTextInput: document.getElementById('signature-text')
        };

        this.downloadManager.setLoadingElement(this.elements.loading);
        this.editorController.init(this.elements);
        this.editorController.setOnConfigChange((config) => {
            this.currentTemplateConfig = { ...config };
            
            // 实时保存当前模板的配置
            if (this.currentTemplate) {
                localStorage.setItem(`xhs_tpl_config_${this.currentTemplate}`, JSON.stringify(config));
            }
            
            this.generatePreview();
        });
    }

    bindEvents() {
        this.elements.textInput.addEventListener('input', () => {
            this.schedulePreview(300);
        });

        this.elements.downloadAllBtn.addEventListener('click', () => {
            this.downloadAllImages();
        });

        this.elements.resetTemplateBtn.addEventListener('click', () => {
            this.resetTemplate();
        });

        this.elements.previewList.addEventListener('scroll', () => {
            this.updateActiveIndicator();
        });

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
            if (i === index) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
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

    schedulePreview(delay = 300) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.generatePreview();
        }, delay);
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
            if (template.id === this.currentTemplate) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <div class="template-item-name">${template.name}</div>
                <div class="template-item-desc">${template.description}</div>
            `;
            item.addEventListener('click', () => {
                this.selectTemplate(template.id);
            });
            this.elements.templateList.appendChild(item);
        });
    }

    async selectTemplate(templateId) {
        const template = await this.templateManager.loadTemplate(templateId);
        if (!template) return;

        this.currentTemplate = templateId;
        
        // 尝试从本地存储加载用户自定义的配置
        const savedConfig = localStorage.getItem(`xhs_tpl_config_${templateId}`);
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                this.currentTemplateConfig = { ...template.config, ...parsed };
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

    generatePreview() {
        const text = this.elements.textInput.value.trim();
        if (!text) {
            this.elements.previewList.innerHTML = '<div class="empty-state">请输入文字内容</div>';
            this.elements.previewCount.textContent = '共 0 张图片';
            this.elements.downloadAllBtn.disabled = true;
            this.splitPages = [];
            this.renderIndicators(0);
            return;
        }

        if (!this.currentTemplateConfig) return;

        const scrollLeft = this.elements.previewList.scrollLeft;
        this.elements.loading.classList.add('active');
        this.elements.previewList.innerHTML = '';

        const splitter = new TextSplitter(this.currentTemplateConfig);
        this.splitPages = splitter.split(text);

        this.elements.previewCount.textContent = `共 ${this.splitPages.length} 张图片`;

        if (this.splitPages.length === 0) {
            this.elements.previewList.innerHTML = '<div class="empty-state">没有可生成的内容</div>';
            this.elements.loading.classList.remove('active');
            this.elements.downloadAllBtn.disabled = true;
            this.renderIndicators(0);
            return;
        }

        this.elements.downloadAllBtn.disabled = false;
        this.renderIndicators(this.splitPages.length);

        this.splitPages.forEach((pageLayouts, index) => {
            const previewItem = this.previewGenerator.createPreviewItem(
                pageLayouts,
                index,
                this.splitPages.length,
                this.currentTemplate,
                this.currentTemplateConfig,
                (index) => this.downloadSingleImage(index)
            );
            this.elements.previewList.appendChild(previewItem);
        });

        this.elements.loading.classList.remove('active');
        
        requestAnimationFrame(() => {
            this.elements.previewList.scrollLeft = scrollLeft;
            this.updateActiveIndicator();
        });
    }

    downloadSingleImage(index) {
        const pageLayouts = this.splitPages[index];
        this.downloadManager.download(pageLayouts, this.currentTemplateConfig, this.currentTemplate, index);
    }

    downloadAllImages() {
        this.downloadManager.downloadAll(this.splitPages, this.currentTemplateConfig, this.currentTemplate, this.elements.downloadAllBtn);
    }

    resetTemplate() {
        const template = this.templateManager.getTemplate(this.currentTemplate);
        if (template) {
            // 清除本地存储的配置
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
