/**
 * CanvasTextEngine - 帆布排版引擎
 * 
 * 设计原则：
 * 1. 最小单位测量：基于单个字符的测量进行精确换行，确保排版在不同字体下的稳定性。
 * 2. 语义化布局：将 Markdown Token 转换为具有层级关系的 Layout Blocks。
 * 3. 跨页能力：支持对 Layout Blocks 进行高度检测与逻辑切分，为 TextSplitter 提供拆分依据。
 * 4. 富文本渲染：支持内联样式的组合（加粗、斜体、高亮、代码、标题级别）。
 */
class CanvasTextEngine {
    constructor(config = {}) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.updateConfig(config);
    }

    /**
     * 更新全局排版参数
     */
    updateConfig(config) {
        const defaultFont = "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif";
        this.config = {
            fontSize: 16, lineHeight: 1.6, letterSpacing: 0,
            fontFamily: defaultFont, textPadding: 35, cardWidth: PREVIEW_WIDTH || 500,
            ...config
        };
        
        if (this.config.fontFamily === 'inherit' || !this.config.fontFamily) {
            this.config.fontFamily = defaultFont;
        }
        
        this.drawWidth = config.drawWidth || (this.config.cardWidth - (parseFloat(this.config.textPadding) * 2 || 70));
    }

    setFont(options = {}) {
        const { fontSize = this.config.fontSize, fontWeight = 'normal', fontStyle = 'normal', fontFamily = this.config.fontFamily } = options;
        this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        return this.ctx.font;
    }

    measureTextWidth(text, fontSize = this.config.fontSize, fontWeight = 'normal', fontStyle = 'normal') {
        if (!text) return 0;
        this.setFont({ fontSize, fontWeight, fontStyle });
        const metrics = this.ctx.measureText(text);
        const spacing = text.length * (parseFloat(this.config.letterSpacing) || 0);
        return metrics.width + spacing;
    }

    /**
     * 将原始文本拆分为行（用于简单文本或代码块）
     */
    splitIntoLines(text, style = {}, maxWidth = this.drawWidth) {
        const { fontSize = this.config.fontSize, fontWeight = 'normal' } = style;
        const lines = [];
        let currentLine = '', currentWidth = 0;

        for (const char of text) {
            if (char === '\n') {
                lines.push(currentLine);
                currentLine = ''; currentWidth = 0;
                continue;
            }

            const charWidth = this.measureTextWidth(char, fontSize, fontWeight);
            if (currentWidth + charWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = char; currentWidth = charWidth;
            } else {
                currentLine += char; currentWidth += charWidth;
            }
        }
        if (currentLine !== '') lines.push(currentLine);
        return lines;
    }

    /**
     * 将解析后的 Token 转换为布局对象
     */
    layoutToken(token) {
        const layouts = [];
        const baseLineHeight = this.config.fontSize * this.config.lineHeight;

        switch (token.type) {
            case 'heading': {
                const scales = { 1: this.config.h1Scale || 1.6, 2: this.config.h2Scale || 1.4, 3: this.config.h3Scale || 1.2 };
                const fontSize = this.config.fontSize * (scales[token.depth] || 1.1);
                const lines = this.layoutInlineText(token.tokens || [{ type: 'text', text: token.text }], this.drawWidth, { 
                    fontSize, fontWeight: '800', headingLevel: token.depth 
                });
                
                const marginTop = fontSize * 0.6, marginBottom = fontSize * 0.4;
                layouts.push({
                    type: 'heading', depth: token.depth, lines,
                    height: marginTop + (lines.length * fontSize * this.config.lineHeight) + marginBottom,
                    marginTop, marginBottom
                });
                break;
            }
            case 'hr': {
                layouts.push({ type: 'divider', height: 20 });
                break;
            }
            case 'paragraph': {
                const lines = this.layoutInlineText(token.tokens || [{ type: 'text', text: token.text }]);
                const marginBottom = this.config.fontSize * 0.8;
                layouts.push({
                    type: 'paragraph', lines, height: (lines.length * baseLineHeight) + marginBottom,
                    marginTop: 0, marginBottom
                });
                break;
            }
            case 'blockquote': {
                const indent = 20;
                const lines = this.layoutInlineText(token.tokens || [{ type: 'text', text: token.text }], this.drawWidth - indent);
                const marginBottom = this.config.fontSize * 0.8;
                layouts.push({
                    type: 'blockquote', lines, indent, height: (lines.length * baseLineHeight) + marginBottom,
                    marginTop: 0, marginBottom
                });
                break;
            }
            case 'list': {
                token.items.forEach((item, index) => {
                    const prefix = token.ordered ? `${index + 1}. ` : '• ';
                    const prefixWidth = this.measureTextWidth(prefix);
                    let inlineTokens = item.tokens || [];
                    if (inlineTokens.length === 1 && inlineTokens[0].type === 'paragraph') {
                        inlineTokens = inlineTokens[0].tokens || [];
                    }
                    const lines = this.layoutInlineText(inlineTokens, this.drawWidth - prefixWidth);
                    const marginBottom = this.config.fontSize * 0.8;
                    layouts.push({
                        type: 'list-item', prefix, prefixWidth, lines,
                        height: (lines.length * baseLineHeight) + marginBottom,
                        marginTop: 0, marginBottom
                    });
                });
                break;
            }
            case 'space': {
                layouts.push({ type: 'space', height: this.config.fontSize });
                break;
            }
            case 'code': {
                const lines = this.splitIntoLines(token.text);
                const marginBottom = this.config.fontSize * 0.8;
                layouts.push({
                    type: 'code-block',
                    lines: lines.map(text => ({ text, fontSize: this.config.fontSize * 0.9, isCode: true })),
                    height: (lines.length * baseLineHeight) + marginBottom,
                    marginTop: 0, marginBottom
                });
                break;
            }
        }
        return layouts;
    }

    /**
     * 核心方法：处理具有内联样式的文本换行
     */
    layoutInlineText(inlineTokens, maxWidth = this.drawWidth, inheritedStyle = {}) {
        const lines = [];
        let currentLine = [], currentLineWidth = 0;

        if (!inlineTokens) return [];

        const processTokens = (tokens, currentStyle) => {
            for (const token of tokens) {
                const style = {
                    fontSize: currentStyle.fontSize || this.config.fontSize,
                    fontWeight: currentStyle.fontWeight || 'normal',
                    fontStyle: currentStyle.fontStyle || 'normal',
                    isHighlight: currentStyle.isHighlight || false,
                    isCode: currentStyle.isCode || false,
                    textDecoration: currentStyle.textDecoration || 'none',
                    headingLevel: currentStyle.headingLevel
                };

                if (token.type === 'strong' || token.type === 'bold') style.fontWeight = '700';
                if (token.type === 'em' || token.type === 'italic') style.fontStyle = 'italic';
                if (token.type === 'codespan' || token.type === 'code') style.isCode = true;
                if (token.type === 'del' || token.type === 'strikethrough') style.textDecoration = 'line-through';
                if (token.type === 'highlight' || (token.raw && token.raw.startsWith('==') && token.raw.endsWith('=='))) {
                    style.isHighlight = true;
                }

                if (token.tokens && token.tokens.length > 0) {
                    processTokens(token.tokens, style);
                } else {
                    const text = token.text || token.raw || '';
                    if (!text) continue;

                    for (const char of Array.from(text)) {
                        const charWidth = this.measureTextWidth(char, style.fontSize, style.fontWeight, style.fontStyle);

                        if (currentLineWidth + charWidth > maxWidth && currentLine.length > 0) {
                            lines.push(currentLine);
                            currentLine = [{ ...style, text: char }];
                            currentLineWidth = charWidth;
                        } else {
                            const last = currentLine[currentLine.length - 1];
                            if (last && last.fontWeight === style.fontWeight && last.fontStyle === style.fontStyle && 
                                last.isHighlight === style.isHighlight && last.isCode === style.isCode && 
                                last.fontSize === style.fontSize && last.textDecoration === style.textDecoration &&
                                last.headingLevel === style.headingLevel) {
                                last.text += char;
                            } else {
                                currentLine.push({ ...style, text: char });
                            }
                            currentLineWidth += charWidth;
                        }
                    }
                }
            }
        };

        processTokens(inlineTokens, inheritedStyle);
        if (currentLine.length > 0) lines.push(currentLine);
        return lines;
    }

    getLineHeight(line, config) {
         const configFontSize = parseFloat(config.fontSize) || 16;
         const maxFontSize = Array.isArray(line) 
            ? Math.max(...line.map(s => parseFloat(s.fontSize) || configFontSize))
            : (parseFloat(line.fontSize) || configFontSize);
         return maxFontSize * (parseFloat(config.lineHeight) || 1.6);
    }

    /**
     * 将布局块拆分为两部分，实现跨页排版
     */
    splitLayout(layout, availableHeight) {
        if (!layout.lines || !Array.isArray(layout.lines) || layout.lines.length === 0) return null;

        const lines = layout.lines;
        let currentHeight = layout.marginTop || 0, splitIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const lineHeight = this.getLineHeight(lines[i], this.config);
            if (currentHeight + lineHeight > availableHeight) {
                splitIndex = i; break;
            }
            currentHeight += lineHeight;
        }

        if (splitIndex <= 0 || splitIndex >= lines.length) return null;

        const part1 = { ...layout, lines: lines.slice(0, splitIndex), height: currentHeight, marginBottom: 0 };
        const part2 = { ...layout, lines: lines.slice(splitIndex), marginTop: 0 };
        
        let part2ContentHeight = 0;
        part2.lines.forEach(line => part2ContentHeight += this.getLineHeight(line, this.config));
        part2.height = part2ContentHeight + (layout.marginBottom || 0);

        if (layout.type === 'list-item') {
            part2.type = 'paragraph'; part2.prefix = ''; 
        }

        return { part1, part2 };
    }
}
