/**
 * MarkdownParser
 * Markdown 解析工具 - 统一处理 Markdown 到 HTML 的转换
 * @version 1.0
 */
class MarkdownParser {
    static init() {
        if (typeof marked === 'undefined') return;

        // 添加 ==高亮== 语法支持
        const highlightExtension = {
            name: 'highlight',
            level: 'inline',
            start(src) { return src.indexOf('=='); },
            tokenizer(src, tokens) {
                const rule = /^==([^=]+)==/;
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: 'highlight',
                        raw: match[0],
                        text: match[1],
                        tokens: this.lexer.inlineTokens(match[1])
                    };
                }
            },
            renderer(token) {
                return `<mark class="highlight">${token.text}</mark>`;
            }
        };

        marked.use({ extensions: [highlightExtension] });
        
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    static parse(text) {
        if (typeof marked === 'undefined') {
            console.warn('marked library not loaded, using fallback');
            return text.replace(/\n/g, '<br>');
        }

        this.init();
        return marked.parse(text);
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
