class TextSplitter {
    constructor(config) {
        this.config = config;
        this.engine = new CanvasTextEngine(config);
        this.maxHeight = MAX_CONTENT_HEIGHT;
    }

    updateConfig(config) {
        this.config = config;
        this.engine.updateConfig(config);
    }

    split(text) {
        if (!text.trim()) return [];

        const tokens = marked.lexer(text);
        const pages = [];
        let currentPage = {
            layouts: [],
            totalHeight: 0
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
                if (currentPage.totalHeight + layout.height > this.maxHeight) {
                    if (currentPage.layouts.length > 0) {
                        pages.push(currentPage.layouts);
                        currentPage = { layouts: [], totalHeight: 0 };
                    }
                }
                
                currentPage.layouts.push(layout);
                currentPage.totalHeight += layout.height;
            }
        }

        if (currentPage.layouts.length > 0) {
            pages.push(currentPage.layouts);
        }

        return pages;
    }

    destroy() {}
}
