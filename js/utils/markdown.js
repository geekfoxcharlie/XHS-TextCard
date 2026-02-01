/**
 * MarkdownParser - Markdown 解析工具
 */
class MarkdownParser {
    static init() {
        if (typeof marked === 'undefined' || this.isInitialized) return;

        // 添加 ==高亮== 自定义语法
        const highlightExtension = {
            name: 'highlight',
            level: 'inline',
            start(src) { return src.indexOf('=='); },
            tokenizer(src) {
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
            renderer(token) { return `<mark class="highlight">${token.text}</mark>`; }
        };

        marked.use({ extensions: [highlightExtension] });
        marked.setOptions({ breaks: true, gfm: true });
        this.isInitialized = true;
    }

    static parse(text) {
        if (typeof marked === 'undefined') return text.replace(/\n/g, '<br>');
        if (!this.isInitialized) this.init();
        return marked.parse(text);
    }
}
