/**
 * TemplateManager
 * 模板管理器 - 负责模板配置加载、存储与管理
 * @version 1.0
 */
class TemplateManager {
    constructor() {
        this.templates = {};
        this.loadedCSS = new Set();
        this.currentCategory = 'featured';
    }

    async loadTemplateIndex() {
        try {
            // 添加时间戳防止浏览器缓存 index.json
            const response = await fetch(`templates/index.json?t=${Date.now()}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('加载模板索引失败:', error);
            return null;
        }
    }

    async loadTemplate(templateId) {
        if (this.templates[templateId]) {
            return this.templates[templateId];
        }

        try {
            // 加载模板配置 (同样添加时间戳防止缓存)
            const configResponse = await fetch(`templates/${templateId}.json?t=${Date.now()}`);
            const configData = await configResponse.json();

            // 加载模板样式
            if (configData.cssFile && !this.loadedCSS.has(templateId)) {
                const cssResponse = await fetch(`templates/${configData.cssFile}?t=${Date.now()}`);
                const cssText = await cssResponse.text();
                this.injectCSS(cssText, templateId);
                this.loadedCSS.add(templateId);
            }

            // 确保配置项完整（数据迁移与默认值）
            const config = {
                bgColor: "#FFFFFF",
                textColor: "#333333",
                fontSize: 16,
                lineHeight: 1.8,
                letterSpacing: 0.5,
                textPadding: 40,
                fontFamily: "inherit",
                hasWatermark: false,
                watermarkText: "极客狐",
                watermarkColor: "rgba(0,0,0,0.1)",
                hasSignature: true,
                signatureText: "极客狐",
                signatureColor: "#555555",
                signaturePosition: "bottom",
                signatureStyle: "modern-pill",
                ...configData.config
            };

            const template = {
                id: templateId,
                name: configData.name,
                description: configData.description,
                author: configData.author,
                version: configData.version,
                config: config,
                cssFile: configData.cssFile,
                className: `template-${templateId}`
            };

            this.templates[templateId] = template;
            return template;
        } catch (error) {
            console.error(`加载模板 ${templateId} 失败:`, error);
            return null;
        }
    }

    injectCSS(cssText, templateId) {
        const style = document.createElement('style');
        style.setAttribute('data-template', templateId);
        style.textContent = cssText;
        document.head.appendChild(style);
    }

    getTemplate(templateId) {
        return this.templates[templateId] || null;
    }

    getTemplatesByCategory(category) {
        // 按照 templateOrder 的顺序返回模板，确保列表稳定
        let allTemplates = [];
        if (this.templateOrder) {
            allTemplates = this.templateOrder
                .map(id => this.templates[id])
                .filter(t => t !== undefined && t !== null);
        } else {
            allTemplates = Object.values(this.templates);
        }

        if (category === 'featured') {
            // 推荐栏：显示所有标记为 featured 且作者为 system 的模板
            return allTemplates.filter(t => {
                const isFeatured = t.featured === true || t.featured === undefined;
                const author = (t.author || '').toLowerCase();
                return isFeatured && author === 'system';
            });
        } else if (category === 'custom') {
            // 自定义栏：显示所有非系统作者的模板
            return allTemplates.filter(t => {
                const author = (t.author || '').toLowerCase();
                return author !== 'system';
            });
        }
        return allTemplates;
    }

    async init() {
        // 清理旧的本地存储，确保完全走配置
        localStorage.removeItem('customTemplates');

        // 加载模板索引
        const index = await this.loadTemplateIndex();
        if (index && index.templates) {
            // 按照索引顺序保存 ID 列表，用于保持固定排序
            this.templateOrder = index.templates.map(t => t.id);
            
            // 异步加载所有模板
            const loadPromises = index.templates.map(async (templateInfo) => {
                const template = await this.loadTemplate(templateInfo.id);
                if (template) {
                    template.featured = templateInfo.featured;
                }
                return template;
            });

            await Promise.all(loadPromises);
        }

        return this.templates;
    }
}

