class CanvasTextEngine {
    constructor(config = {}) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.updateConfig(config);
    }

    updateConfig(config) {
        this.config = {
            fontSize: 16,
            lineHeight: 1.6,
            letterSpacing: 0,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif",
            textPadding: 35,
            cardWidth: PREVIEW_WIDTH || 500,
            ...config
        };
        
        if (this.config.fontFamily === 'inherit' || !this.config.fontFamily) {
            this.config.fontFamily = "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif";
        }
        
        this.drawWidth = this.config.cardWidth - (this.config.textPadding * 2);
    }

    setFont(options = {}) {
        const fontSize = options.fontSize || this.config.fontSize;
        const fontWeight = options.fontWeight || 'normal';
        const fontStyle = options.fontStyle || 'normal';
        const fontFamily = options.fontFamily || this.config.fontFamily;
        
        this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        return this.ctx.font;
    }

    measureTextWidth(text, fontSize = this.config.fontSize, fontWeight = 'normal') {
        if (!text) return 0;
        this.setFont({ fontSize, fontWeight });
        const metrics = this.ctx.measureText(text);
        const spacing = text.length * (parseFloat(this.config.letterSpacing) || 0);
        return metrics.width + spacing;
    }

    splitIntoLines(text, style = {}, maxWidth = this.drawWidth) {
        const fontSize = style.fontSize || this.config.fontSize;
        const fontWeight = style.fontWeight || 'normal';
        const lines = [];
        let currentLine = '';
        let currentWidth = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === '\n') {
                lines.push(currentLine);
                currentLine = '';
                currentWidth = 0;
                continue;
            }

            const charWidth = this.measureTextWidth(char, fontSize, fontWeight);
            
            if (currentWidth + charWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = char;
                currentWidth = charWidth;
            } else {
                currentLine += char;
                currentWidth += charWidth;
            }
        }

        if (currentLine !== '') {
            lines.push(currentLine);
        }

        return lines;
    }

    layoutToken(token) {
        const layouts = [];
        const baseLineHeight = this.config.fontSize * this.config.lineHeight;

        switch (token.type) {
            case 'heading': {
                const hSizeMap = { 1: 1.6, 2: 1.4, 3: 1.2 };
                const scale = hSizeMap[token.depth] || 1.1;
                const fontSize = this.config.fontSize * scale;
                const fontWeight = '800';
                const lines = this.splitIntoLines(token.text, { fontSize, fontWeight });
                
                const marginTop = fontSize * 0.6;
                const marginBottom = fontSize * 0.4;
                const contentHeight = lines.length * fontSize * 1.3;
                
                layouts.push({
                    type: 'heading',
                    depth: token.depth,
                    lines: lines.map(text => ({ text, fontSize, fontWeight })),
                    height: marginTop + contentHeight + marginBottom,
                    marginTop,
                    marginBottom
                });
                break;
            }
            case 'paragraph': {
                const lines = this.layoutInlineText(token.tokens || [{ type: 'text', text: token.text }]);
                const marginTop = 0;
                const marginBottom = this.config.fontSize * 0.8;
                const contentHeight = lines.length * baseLineHeight;

                layouts.push({
                    type: 'paragraph',
                    lines: lines,
                    height: marginTop + contentHeight + marginBottom,
                    marginTop,
                    marginBottom
                });
                break;
            }
            case 'blockquote': {
                const indent = 20;
                const lines = this.layoutInlineText(token.tokens || [{ type: 'text', text: token.text }], this.drawWidth - indent);
                const marginTop = 0;
                const marginBottom = this.config.fontSize * 0.8;
                const contentHeight = lines.length * baseLineHeight;

                layouts.push({
                    type: 'blockquote',
                    lines: lines,
                    indent: indent,
                    height: marginTop + contentHeight + marginBottom,
                    marginTop,
                    marginBottom
                });
                break;
            }
            case 'list': {
                token.items.forEach((item, index) => {
                    const prefix = token.ordered ? `${index + 1}. ` : '• ';
                    const prefixWidth = this.measureTextWidth(prefix);
                    const lines = this.layoutInlineText(item.tokens, this.drawWidth - prefixWidth);
                    const marginTop = 0;
                    const marginBottom = this.config.fontSize * 0.3;
                    const contentHeight = lines.length * baseLineHeight;

                    layouts.push({
                        type: 'list-item',
                        prefix: prefix,
                        prefixWidth: prefixWidth,
                        lines: lines,
                        height: marginTop + contentHeight + marginBottom,
                        marginTop,
                        marginBottom
                    });
                });
                break;
            }
            case 'space': {
                layouts.push({
                    type: 'space',
                    height: this.config.fontSize
                });
                break;
            }
            case 'code': {
                const lines = this.splitIntoLines(token.text);
                const marginTop = 0;
                const marginBottom = this.config.fontSize * 0.8;
                const contentHeight = lines.length * baseLineHeight;
                layouts.push({
                    type: 'code-block',
                    lines: lines.map(text => ({ text, fontSize: this.config.fontSize * 0.9, fontWeight: 'normal', isCode: true })),
                    height: marginTop + contentHeight + marginBottom,
                    marginTop,
                    marginBottom
                });
                break;
            }
            default: {
                if (token.text) {
                    const lines = this.splitIntoLines(token.text);
                    layouts.push({
                        type: 'text',
                        lines: lines.map(text => ({ text, fontSize: this.config.fontSize, fontWeight: 'normal' })),
                        height: lines.length * baseLineHeight
                    });
                }
            }
        }
        return layouts;
    }

    layoutInlineText(inlineTokens, maxWidth = this.drawWidth) {
        const lines = [];
        let currentLine = [];
        let currentLineWidth = 0;

        if (!inlineTokens) return [];

        for (const token of inlineTokens) {
            const style = {
                fontSize: this.config.fontSize,
                fontWeight: (token.type === 'strong' || token.type === 'bold') ? '700' : 'normal',
                fontStyle: (token.type === 'em' || token.type === 'italic') ? 'italic' : 'normal',
                isHighlight: token.type === 'highlight',
                isCode: token.type === 'codespan' || token.type === 'code'
            };

            if (token.raw && token.raw.startsWith('==')) {
                style.isHighlight = true;
                token.text = token.text || token.raw.slice(2, -2);
            }

            const text = token.text || '';
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const charWidth = this.measureTextWidth(char, style.fontSize, style.fontWeight);

                if (currentLineWidth + charWidth > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = [{ ...style, text: char }];
                    currentLineWidth = charWidth;
                } else {
                    const lastSegment = currentLine[currentLine.length - 1];
                    if (lastSegment && 
                        lastSegment.fontWeight === style.fontWeight && 
                        lastSegment.fontStyle === style.fontStyle && 
                        lastSegment.isHighlight === style.isHighlight &&
                        lastSegment.isCode === style.isCode) {
                        lastSegment.text += char;
                    } else {
                        currentLine.push({ ...style, text: char });
                    }
                    currentLineWidth += charWidth;
                }
            }
        }

        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return lines;
    }
}
