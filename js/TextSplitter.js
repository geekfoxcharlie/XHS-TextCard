/**
 * TextSplitter - 智能文本分页器
 * 
 * 设计原则：
 * 1. 布局一致性：通过调用 TemplateDefinitions.getContentBox 确保分页逻辑与渲染逻辑共享相同的尺寸定义。
 * 2. 递归拆分：当一个块（如长段落）超过剩余空间时，递归地将其切分为多页，确保没有任何文本溢出。
 * 3. 语义化分页：支持 Markdown 分割线 (---) 作为强制分页符。
 */
class TextSplitter {
    constructor(config, templateId = 'ios-memo') {
        this.config = config;
        this.templateId = templateId;
        this.engine = new CanvasTextEngine(config);
        this.calculateLayout();
        
        this.engine.updateConfig({
            ...config,
            drawWidth: this.contentWidth
        });
    }

    /**
     * 更新配置并同步重算布局尺寸
     */
    updateConfig(config, templateId) {
        this.config = config;
        if (templateId) this.templateId = templateId;
        
        this.calculateLayout();
        this.engine.updateConfig({
            ...config,
            drawWidth: this.contentWidth
        });
    }

    /**
     * 计算当前模板允许的最大内容高度和宽度
     */
    calculateLayout() {
        // 核心布局尺寸定义来自于 TemplateDefinitions
        const contentBox = TemplateDefinitions.getContentBox(
            this.templateId, this.config, PREVIEW_WIDTH, PREVIEW_HEIGHT
        );
        this.maxHeight = contentBox.height;
        this.contentWidth = contentBox.width;
    }

    /**
     * 执行分页算法
     */
    split(text) {
        if (!text.trim()) return [];
        if (typeof marked === 'undefined') return [];

        const tokens = marked.lexer(text);
        const pages = [];
        
        // 1. 注入封面页
        if (this.config.hasCover) {
            let coverTitle = this.config.coverTitle;
            if (!coverTitle) {
                // 尝试从 tokens 中寻找第一个标题或第一行文字
                const firstContentToken = tokens.find(t => t.type === 'heading' || t.type === 'paragraph');
                if (firstContentToken) {
                    coverTitle = firstContentToken.text || firstContentToken.raw.split('\n')[0];
                }
            }
            pages.push([{
                type: 'cover',
                title: coverTitle || '未命名文档',
                image: this.config.coverImage
            }]);
        }

        let currentPage = { layouts: [], totalHeight: 0 };

        /**
         * 递归处理布局块，支持跨页拆分
         */
        const processLayout = (layout) => {
            const availableHeight = this.maxHeight - currentPage.totalHeight;

            // 情况 A：块能完全放入当前页
            if (layout.height <= availableHeight) {
                currentPage.layouts.push(layout);
                currentPage.totalHeight += layout.height;
                return;
            }

            // 情况 B：尝试拆分布局块（如将段落切分为前N行和剩余行）
            const splitResult = this.engine.splitLayout(layout, availableHeight);
            
            if (splitResult) {
                if (splitResult.part1.height > 0) {
                    currentPage.layouts.push(splitResult.part1);
                }
                pages.push(currentPage.layouts);
                currentPage = { layouts: [], totalHeight: 0 };
                // 递归处理剩余部分
                processLayout(splitResult.part2);
            } else {
                // 情况 C：无法拆分（如单行标题过长或图片）
                if (currentPage.layouts.length > 0) {
                    pages.push(currentPage.layouts);
                    currentPage = { layouts: [], totalHeight: 0 };
                    processLayout(layout);
                } else {
                    // 即使新页面也放不下，强行放入防止死循环
                    currentPage.layouts.push(layout);
                    currentPage.totalHeight += layout.height;
                }
            }
        };

        for (const token of tokens) {
            if (token.type === 'hr') {
                if (currentPage.layouts.length > 0) {
                    pages.push(currentPage.layouts);
                    currentPage = { layouts: [], totalHeight: 0 };
                }
                continue;
            }

            const layouts = this.engine.layoutToken(token);
            for (const layout of layouts) {
                processLayout(layout);
            }
        }

        if (currentPage.layouts.length > 0) {
            pages.push(currentPage.layouts);
        }

        return pages;
    }
}
