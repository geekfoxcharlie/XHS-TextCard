class App {
    constructor() {
        this.templateManager = new TemplateManager();
        this.previewGenerator = new PreviewGenerator(this.templateManager);
        this.downloadManager = new DownloadManager();
        this.editorController = new EditorController();

        this.currentTemplate = 'ios-memo';
        this.currentTemplateConfig = null;
        this.currentCategory = 'featured';
        this.splitPages = [];
        
        this.elements = {};
        this.debounceTimer = null;
    }

    init() {
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
            loading: document.getElementById('loading'),
            templateCategories: document.querySelectorAll('.template-category'),
            visualEditor: document.getElementById('visual-editor'),
            fontSizeInput: document.getElementById('font-size'),
            lineHeightInput: document.getElementById('line-height'),
            letterSpacingInput: document.getElementById('letter-spacing'),
            textPaddingInput: document.getElementById('text-padding'),
            fontFamilySelect: document.getElementById('font-family'),
            resetTemplateBtn: document.getElementById('reset-template-btn'),
            saveTemplateBtn: document.getElementById('save-template-btn'),
            hasWatermarkCheck: document.getElementById('has-watermark'),
            watermarkTextInput: document.getElementById('watermark-text'),
            hasSignatureCheck: document.getElementById('has-signature'),
            signatureTextInput: document.getElementById('signature-text'),
            saveModal: document.getElementById('save-modal'),
            modalTplName: document.getElementById('modal-tpl-name'),
            modalTplDesc: document.getElementById('modal-tpl-desc'),
            closeModalBtn: document.getElementById('close-save-modal'),
            cancelModalBtn: document.getElementById('cancel-save-modal'),
            confirmModalBtn: document.getElementById('confirm-save-modal')
        };

        this.downloadManager.setLoadingElement(this.elements.loading);
        this.editorController.init(this.elements);
        this.editorController.setOnConfigChange((config) => {
            this.currentTemplateConfig = { ...config };
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

        this.elements.templateCategories.forEach(category => {
            category.addEventListener('click', () => {
                this.selectCategory(category.dataset.category);
            });
        });

        this.elements.resetTemplateBtn.addEventListener('click', () => {
            this.resetTemplate();
        });

        this.elements.saveTemplateBtn.addEventListener('click', () => {
            this.showSaveModal();
        });

        this.elements.closeModalBtn.addEventListener('click', () => this.hideSaveModal());
        this.elements.cancelModalBtn.addEventListener('click', () => this.hideSaveModal());
        this.elements.confirmModalBtn.addEventListener('click', () => this.handleSaveTemplate());
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
        const templates = this.templateManager.getTemplatesByCategory(this.currentCategory);

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
        this.currentTemplateConfig = { ...template.config };

        this.renderTemplateList();
        this.editorController.setConfig(this.currentTemplateConfig);

        this.generatePreview();
    }

    selectCategory(category) {
        this.currentCategory = category;
        this.elements.templateCategories.forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === category);
        });
        this.renderTemplateList();
    }

    generatePreview() {
        const text = this.elements.textInput.value.trim();
        if (!text) {
            this.elements.previewList.innerHTML = '<div class="empty-state">请输入文字内容</div>';
            this.elements.previewCount.textContent = '共 0 张图片';
            this.elements.downloadAllBtn.disabled = true;
            this.splitPages = [];
            return;
        }

        if (!this.currentTemplateConfig) return;

        const scrollTop = this.elements.previewList.scrollTop;
        this.elements.loading.classList.add('active');
        this.elements.previewList.innerHTML = '';

        const splitter = new TextSplitter(this.currentTemplateConfig);
        this.splitPages = splitter.split(text);

        this.elements.previewCount.textContent = `共 ${this.splitPages.length} 张图片`;

        if (this.splitPages.length === 0) {
            this.elements.previewList.innerHTML = '<div class="empty-state">没有可生成的内容</div>';
            this.elements.loading.classList.remove('active');
            this.elements.downloadAllBtn.disabled = true;
            return;
        }

        this.elements.downloadAllBtn.disabled = false;

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
        this.elements.previewList.scrollTop = scrollTop;
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
            this.currentTemplateConfig = { ...template.config };
            this.editorController.setConfig(this.currentTemplateConfig);
            this.generatePreview();
        }
    }

    showSaveModal() {
        this.elements.modalTplName.value = '';
        this.elements.modalTplDesc.value = '';
        this.elements.saveModal.style.display = 'flex';
        this.elements.modalTplName.focus();
    }

    hideSaveModal() {
        this.elements.saveModal.style.display = 'none';
    }

    async handleSaveTemplate() {
        alert('模板保存功能稍后更新适配 Canvas 方案');
        this.hideSaveModal();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
