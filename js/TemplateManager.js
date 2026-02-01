/**
 * TemplateManager - 模板加载与状态管理器
 * 
 * 设计原则：
 * 1. 动态加载：按需通过 Fetch 加载模板 JSON 配置，减少首屏体积。
 * 2. 健壮性：通过默认值合并 (Object Spread) 确保新旧模板在配置项变更时的兼容性。
 * 3. 顺序可控：通过 index.json 维护模板的显示顺序和推荐位状态。
 */
class TemplateManager {
    constructor() {
        this.templates = {};
        this.currentCategory = 'featured';
    }

    async loadTemplateIndex() {
        try {
            const response = await fetch(`templates/index.json?t=${Date.now()}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to load template index:', error);
            return null;
        }
    }

    async loadTemplate(templateId) {
        if (this.templates[templateId]) return this.templates[templateId];

        try {
            const response = await fetch(`templates/${templateId}.json?t=${Date.now()}`);
            const configData = await response.json();

            // 数据合并与默认值兜底
            const config = {
                bgColor: "#FFFFFF", textColor: "#333333", fontSize: 16,
                lineHeight: 1.8, letterSpacing: 0.5, textPadding: 40,
                fontFamily: "inherit", hasWatermark: false, watermarkText: "极客狐",
                watermarkColor: "rgba(0,0,0,0.1)", hasSignature: true, signatureText: "极客狐",
                signatureColor: "#555555", signaturePosition: "bottom", signatureStyle: "modern-pill",
                h1Scale: 1.6, h2Scale: 1.4, h3Scale: 1.2, accentColor: "#333333",
                ...configData.config
            };

            const template = {
                id: templateId,
                name: configData.name,
                description: configData.description,
                author: configData.author,
                version: configData.version,
                config: config,
                className: `template-${templateId}`
            };

            this.templates[templateId] = template;
            return template;
        } catch (error) {
            console.error(`Failed to load template ${templateId}:`, error);
            return null;
        }
    }

    getTemplate(templateId) { return this.templates[templateId] || null; }

    getAllTemplates() {
        if (this.templateOrder) {
            return this.templateOrder.map(id => this.templates[id]).filter(t => !!t);
        }
        return Object.values(this.templates);
    }

    async init() {
        localStorage.removeItem('customTemplates'); // 清理旧数据

        const index = await this.loadTemplateIndex();
        if (index && index.templates) {
            this.templateOrder = index.templates.map(t => t.id);
            const loadPromises = index.templates.map(async (info) => {
                const template = await this.loadTemplate(info.id);
                if (template) template.featured = info.featured;
                return template;
            });
            await Promise.all(loadPromises);
        }
        return this.templates;
    }
}

