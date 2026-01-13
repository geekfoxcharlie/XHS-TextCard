/**
 * MarkdownParser
 * Markdown 解析工具 - 统一处理 Markdown 到 HTML 的转换
 * @version 1.0
 */
class MarkdownParser {
    static parse(text) {
        if (typeof marked === 'undefined') {
            console.warn('marked library not loaded, using fallback');
            return text.replace(/\n/g, '<br>');
        }

        marked.setOptions({
            breaks: true,
            gfm: true
        });

        const processedText = text.replace(/==(.*?)==/g, '<mark class="highlight">$1</mark>');
        return marked.parse(processedText);
    }

    static isHtml(text) {
        return text.trim().startsWith('<') && text.trim().endsWith('>');
    }

    static parseIfNeeded(text) {
        if (this.isHtml(text)) {
            return text;
        }
        return this.parse(text);
    }
}
