/**
 * TextSplitter
 * 文本分割器 - 负责长文本的智能分页与排版
 * 简化算法：逐节点尝试放置，放不下则拆分
 * @version 1.0
 */
class TextSplitter {
    constructor(config) {
        this.textConfig = {
            fontSize: config.fontSize,
            lineHeight: config.lineHeight,
            letterSpacing: config.letterSpacing,
            fontFamily: config.fontFamily,
            textPadding: config.textPadding
        };

        this.TEXT_AREA_WIDTH = TEXT_AREA_WIDTH;
        this.TEXT_AREA_HEIGHT = TEXT_AREA_HEIGHT;
        this.SAFETY_MARGIN = SAFETY_MARGIN;
        this.MAX_HEIGHT = MAX_CONTENT_HEIGHT;

        this.measurer = new TextMeasurer(this.textConfig);
    }

    updateConfig(config) {
        this.textConfig = {
            fontSize: config.fontSize,
            lineHeight: config.lineHeight,
            letterSpacing: config.letterSpacing,
            fontFamily: config.fontFamily,
            textPadding: config.textPadding
        };
        this.measurer.updateConfig(this.textConfig);
    }

    split(text) {
        if (!text.trim()) return [];

        const fullHtml = MarkdownParser.parse(text);
        const master = document.createElement('div');
        master.innerHTML = fullHtml;

        const nodes = Array.from(master.childNodes);
        const pages = [];
        let currentPage = '';

        for (const node of nodes) {
            if (node.nodeName === 'HR') {
                if (currentPage) {
                    pages.push(currentPage.trim());
                    currentPage = '';
                }
                continue;
            }

            let nodeHtml = this.getNodeHtml(node);
            if (!nodeHtml || !nodeHtml.trim()) continue;

            if (this.canFit(currentPage + '\n' + nodeHtml)) {
                currentPage += '\n' + nodeHtml;
            } else {
                if (currentPage) {
                    pages.push(currentPage.trim());
                    currentPage = '';
                }
                if (!this.canFit(nodeHtml)) {
                    nodeHtml = this.splitNode(node, pages);
                }
                currentPage = nodeHtml;
            }
        }

        if (currentPage && currentPage.trim()) {
            pages.push(currentPage.trim());
        }

        return pages;
    }

    getNodeHtml(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }
        return node.outerHTML || '';
    }

    canFit(html) {
        if (!html || !html.trim()) return true;
        const result = this.measurer.measure(html);
        return !result.exceedsMax;
    }

    splitNode(node, pages) {
        const tagName = node.nodeName.toUpperCase();
        const isText = node.nodeType === Node.TEXT_NODE;
        const text = isText ? node.textContent : node.innerText || node.textContent;

        if (!text) return '';

        const openTag = isText ? '' : `<${tagName}>`;
        const closeTag = isText ? '' : `</${tagName}>`;

        let result = '';
        let remaining = text;

        while (remaining) {
            const fullHtml = openTag + remaining + closeTag;
            if (this.canFit(fullHtml)) {
                return result + (result ? '\n' : '') + fullHtml;
            }

            const splitPos = this.findSplitPosition(openTag + remaining + closeTag);
            if (splitPos <= 0) {
                const char = remaining.charAt(0);
                const charHtml = openTag + char + closeTag;
                result += (result ? '\n' : '') + charHtml;
                remaining = remaining.slice(1);
            } else {
                const part = remaining.slice(0, splitPos);
                const partHtml = openTag + part + closeTag;
                result += (result ? '\n' : '') + partHtml;
                remaining = remaining.slice(splitPos);
            }
        }

        return result;
    }

    findSplitPosition(html) {
        let left = 0;
        let right = html.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.canFit(html.slice(0, mid))) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        return left > 0 ? left - 1 : 0;
    }

    destroy() {
        this.measurer.destroy();
    }
}
