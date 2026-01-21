/**
 * App
 * 主应用控制器 - 协调各模块运行
 * @version 1.0
 */
class App {
    constructor() {
        this.templateManager = new TemplateManager();
        this.previewGenerator = new PreviewGenerator(this.templateManager);
        this.downloadManager = new DownloadManager();
        this.editorController = new EditorController();

        this.currentTemplate = 'ios-memo';
        this.currentTemplateConfig = null;
        this.currentCategory = 'featured';
        this.splitTexts = [];
        this.previewElements = [];

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
            resetTemplateBtn: document.getElementById('reset-template-btn'),
            saveTemplateBtn: document.getElementById('save-template-btn'),
            hasWatermarkCheck: document.getElementById('has-watermark'),
            watermarkTextInput: document.getElementById('watermark-text'),
            hasSignatureCheck: document.getElementById('has-signature'),
            signatureOptions: document.getElementById('signature-options'),
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
        this.elements.saveModal.addEventListener('click', (e) => {
            if (e.target === this.elements.saveModal) this.hideSaveModal();
        });
    }

    schedulePreview(delay = 300) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.generatePreview();
        }, delay);
    }

    cancelPreview() {
        clearTimeout(this.debounceTimer);
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
        const name = this.elements.modalTplName.value.trim();
        const desc = this.elements.modalTplDesc.value.trim();

        if (!name) {
            alert('请输入模板名称');
            this.elements.modalTplName.focus();
            return;
        }

        this.hideSaveModal();

        const templateId = 'tpl_' + Date.now().toString(36);

        try {
            const cssText = await this.loadAndReplaceCSS(this.currentTemplate, templateId);

            const templateData = {
                name: name,
                description: desc,
                author: "user",
                version: "1.0",
                config: this.currentTemplateConfig,
                cssFile: `${templateId}.css`
            };

            const currentIndex = await this.templateManager.loadTemplateIndex();
            const newTemplates = [...(currentIndex?.templates || [])];

            newTemplates.push({
                id: templateId,
                name: name,
                featured: false
            });

            const indexData = { templates: newTemplates };

            this.downloadJsonFile(`${templateId}.json`, templateData);
            this.downloadJsonFile('index.json', indexData);
            this.downloadTextFile(`${templateId}.css`, cssText);

            alert(`模板已生成！\n\n请手动完成以下步骤：\n1. 将下载的 ${templateId}.json 和 ${templateId}.css 放入 templates 文件夹。\n2. 用下载的 index.json 替换原来的 index.json。\n3. 刷新页面即可看到新模板。`);
        } catch (error) {
            console.error('生成模板失败:', error);
            alert('生成模板失败：' + error.message);
        }
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
            if (template.featured) {
                item.classList.add('featured');
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
        if (!template) {
            console.error('模板加载失败:', templateId);
            return;
        }

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
            this.splitTexts = [];
            this.previewElements = [];
            return;
        }

        if (!this.currentTemplateConfig) return;

        const scrollTop = this.elements.previewList.scrollTop;

        this.elements.loading.classList.add('active');
        this.elements.previewList.innerHTML = '';

        const splitter = new TextSplitter(this.currentTemplateConfig);
        this.splitTexts = splitter.split(text);
        splitter.destroy();

        this.elements.previewCount.textContent = `共 ${this.splitTexts.length} 张图片`;

        if (this.splitTexts.length === 0) {
            this.elements.previewList.innerHTML = '<div class="empty-state">没有可生成的内容</div>';
            this.elements.loading.classList.remove('active');
            this.elements.downloadAllBtn.disabled = true;
            return;
        }

        this.elements.downloadAllBtn.disabled = false;
        this.previewElements = [];

        this.splitTexts.forEach((text, index) => {
            const previewItem = this.previewGenerator.createPreviewItem(
                text,
                index,
                this.splitTexts.length,
                this.currentTemplate,
                this.currentTemplateConfig,
                (index) => this.downloadSingleImage(index)
            );
            this.elements.previewList.appendChild(previewItem);
            this.previewElements.push(previewItem.querySelector('.template-layer'));
        });

        this.elements.loading.classList.remove('active');

        this.elements.previewList.scrollTop = scrollTop;
    }

    downloadSingleImage(index) {
        const element = this.previewElements[index];
        this.downloadManager.download(element, index);
    }

    downloadAllImages() {
        this.downloadManager.downloadAll(this.previewElements, this.elements.downloadAllBtn);
    }

    resetTemplate() {
        const template = this.templateManager.getTemplate(this.currentTemplate);
        if (template) {
            this.currentTemplateConfig = { ...template.config };
            this.editorController.setConfig(this.currentTemplateConfig);
            this.generatePreview();
        }
    }

    async loadAndReplaceCSS(sourceTemplateId, newTemplateId) {
        const response = await fetch(`templates/${sourceTemplateId}.css?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`无法加载模板CSS: ${sourceTemplateId}.css`);
        }

        let cssText = await response.text();
        const sourceClassName = `template-${sourceTemplateId}`;
        const targetClassName = `template-${newTemplateId}`;

        cssText = cssText.replace(new RegExp(sourceClassName, 'g'), targetClassName);

        return cssText;
    }

    downloadJsonFile(filename, data) {
        const content = JSON.stringify(data, null, 2);
        this.downloadTextFile(filename, content, 'application/json');
    }

    downloadTextFile(filename, content, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

