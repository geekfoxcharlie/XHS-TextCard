/**
 * TemplateManager
 * 模板管理器 - 负责模板配置加载、存储与管理
 * @version 1.0
 */
class TemplateManager {
    constructor() {
        this.templates = {};
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
                className: `template-${templateId}`
            };

            this.templates[templateId] = template;
            return template;
        } catch (error) {
            console.error(`加载模板 ${templateId} 失败:`, error);
            return null;
        }
    }

    getTemplate(templateId) {
        return this.templates[templateId] || null;
    }

    getAllTemplates() {
        if (this.templateOrder) {
            return this.templateOrder
                .map(id => this.templates[id])
                .filter(t => t !== undefined && t !== null);
        }
        return Object.values(this.templates);
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

